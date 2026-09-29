const db = require('../config/db');

const CATEGORIES = new Set(['ORDER','PAYMENT','DELIVERY','PRODUCT','ACCOUNT','OTHER']);
const STATUSES = new Set(['OPEN','IN_PROGRESS','WAITING_CUSTOMER','RESOLVED','CLOSED']);
const PRIORITIES = new Set(['LOW','NORMAL','HIGH']);

function cleanText(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

function ticketNumber() {
  return `PB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function addNotification(userId, title, message, type = 'SUPPORT') {
  await db.execute(
    'INSERT INTO notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)',
    [userId, type, title, message],
  );
}

async function notifyAdmins(title, message) {
  const [admins] = await db.execute('SELECT id FROM users WHERE role = \'ADMIN\' AND is_active = TRUE');
  await Promise.all(admins.map((admin) => addNotification(admin.id, title, message)));
}

async function getTicketForCustomer(ticketId, userId) {
  const [rows] = await db.execute(
    `SELECT t.id, t.ticket_number, t.subject, t.category, t.status, t.priority,
            t.order_id, o.order_number, t.created_at, t.updated_at
     FROM support_tickets t
     LEFT JOIN orders o ON o.id = t.order_id
     WHERE t.id = ? AND t.user_id = ?`,
    [ticketId, userId],
  );
  return rows[0] || null;
}

exports.listMine = async (req, res) => {
  const [tickets] = await db.execute(
    `SELECT t.id, t.ticket_number, t.subject, t.category, t.status, t.priority,
            t.order_id, o.order_number, t.created_at, t.updated_at,
            (SELECT COUNT(*) FROM support_messages m WHERE m.ticket_id = t.id AND m.is_internal = FALSE) AS message_count
     FROM support_tickets t
     LEFT JOIN orders o ON o.id = t.order_id
     WHERE t.user_id = ?
     ORDER BY t.updated_at DESC`,
    [req.user.id],
  );
  res.json({ tickets });
};

exports.getMine = async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  if (!Number.isInteger(ticketId) || ticketId < 1) return res.status(400).json({ message: 'Invalid ticket ID' });
  const ticket = await getTicketForCustomer(ticketId, req.user.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  const [messages] = await db.execute(
    `SELECT m.id, m.body, m.created_at, m.sender_user_id = ? AS is_mine,
            u.full_name AS sender_name, u.role AS sender_role
     FROM support_messages m JOIN users u ON u.id = m.sender_user_id
     WHERE m.ticket_id = ? AND m.is_internal = FALSE
     ORDER BY m.created_at ASC`,
    [req.user.id, ticketId],
  );
  res.json({ ticket, messages });
};

exports.create = async (req, res) => {
  const subject = cleanText(req.body.subject, 200);
  const body = cleanText(req.body.message, 4000);
  const category = cleanText(req.body.category, 30).toUpperCase();
  const orderNumber = cleanText(req.body.orderNumber, 40);
  if (!subject || subject.length < 3) return res.status(400).json({ message: 'Subject is required' });
  if (!body || body.length < 5) return res.status(400).json({ message: 'Message is required' });
  if (!CATEGORIES.has(category)) return res.status(400).json({ message: 'Invalid support category' });

  let orderId = null;
  if (orderNumber) {
    const [orders] = await db.execute('SELECT id FROM orders WHERE order_number = ? AND user_id = ?', [orderNumber, req.user.id]);
    if (!orders.length) return res.status(400).json({ message: 'Order not found for this account' });
    orderId = orders[0].id;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const number = ticketNumber();
    const [ticketResult] = await connection.execute(
      `INSERT INTO support_tickets (ticket_number, user_id, order_id, subject, category)
       VALUES (?, ?, ?, ?, ?)`,
      [number, req.user.id, orderId, subject, category],
    );
    await connection.execute(
      'INSERT INTO support_messages (ticket_id, sender_user_id, body) VALUES (?, ?, ?)',
      [ticketResult.insertId, req.user.id, body],
    );
    await connection.commit();
    await notifyAdmins('New support ticket', `${number}: ${subject}`);
    res.status(201).json({ ticket: { id: ticketResult.insertId, ticket_number: number, subject, category, status: 'OPEN' } });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally { connection.release(); }
};

exports.replyMine = async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const body = cleanText(req.body.message, 4000);
  if (!Number.isInteger(ticketId) || ticketId < 1 || !body) return res.status(400).json({ message: 'Valid message is required' });
  const ticket = await getTicketForCustomer(ticketId, req.user.id);
  if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
  if (ticket.status === 'CLOSED') return res.status(409).json({ message: 'This ticket is closed' });
  await db.execute('INSERT INTO support_messages (ticket_id, sender_user_id, body) VALUES (?, ?, ?)', [ticketId, req.user.id, body]);
  await db.execute("UPDATE support_tickets SET status = 'OPEN' WHERE id = ?", [ticketId]);
  await notifyAdmins('Customer replied to a ticket', `${ticket.ticket_number} needs a response.`);
  res.json({ message: 'Reply sent' });
};

exports.adminList = async (req, res) => {
  const status = cleanText(req.query.status, 30).toUpperCase();
  const q = cleanText(req.query.q, 120);
  const where = [];
  const params = [];
  if (status && status !== 'ALL') { if (!STATUSES.has(status)) return res.status(400).json({ message: 'Invalid status' }); where.push('t.status = ?'); params.push(status); }
  if (q) { where.push('(t.ticket_number LIKE ? OR t.subject LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)'); const like = `%${q}%`; params.push(like, like, like, like); }
  const [tickets] = await db.execute(
    `SELECT t.id, t.ticket_number, t.subject, t.category, t.status, t.priority,
            t.order_id, o.order_number, t.created_at, t.updated_at,
            u.id AS customer_id, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
     FROM support_tickets t
     JOIN users u ON u.id = t.user_id
     LEFT JOIN orders o ON o.id = t.order_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY FIELD(t.status, 'OPEN','IN_PROGRESS','WAITING_CUSTOMER','RESOLVED','CLOSED'), t.updated_at DESC`,
    params,
  );
  res.json({ tickets });
};

exports.adminGet = async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  if (!Number.isInteger(ticketId) || ticketId < 1) return res.status(400).json({ message: 'Invalid ticket ID' });
  const [rows] = await db.execute(
    `SELECT t.*, o.order_number, u.full_name AS customer_name, u.email AS customer_email, u.phone AS customer_phone
     FROM support_tickets t JOIN users u ON u.id = t.user_id
     LEFT JOIN orders o ON o.id = t.order_id WHERE t.id = ?`, [ticketId],
  );
  if (!rows.length) return res.status(404).json({ message: 'Ticket not found' });
  const [messages] = await db.execute(
    `SELECT m.id, m.body, m.created_at, m.is_internal, m.sender_user_id,
            u.full_name AS sender_name, u.role AS sender_role
     FROM support_messages m JOIN users u ON u.id = m.sender_user_id
     WHERE m.ticket_id = ? ORDER BY m.created_at ASC`, [ticketId],
  );
  res.json({ ticket: rows[0], messages });
};

exports.adminReply = async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const body = cleanText(req.body.message, 4000);
  if (!Number.isInteger(ticketId) || ticketId < 1 || !body) return res.status(400).json({ message: 'Valid message is required' });
  const [rows] = await db.execute('SELECT id, user_id, ticket_number, status FROM support_tickets WHERE id = ?', [ticketId]);
  if (!rows.length) return res.status(404).json({ message: 'Ticket not found' });
  if (rows[0].status === 'CLOSED') return res.status(409).json({ message: 'This ticket is closed' });
  await db.execute('INSERT INTO support_messages (ticket_id, sender_user_id, body) VALUES (?, ?, ?)', [ticketId, req.user.id, body]);
  await db.execute("UPDATE support_tickets SET status = 'WAITING_CUSTOMER' WHERE id = ?", [ticketId]);
  await addNotification(rows[0].user_id, 'PowerBase support replied', `${rows[0].ticket_number} has a new reply.`);
  res.json({ message: 'Reply sent' });
};

exports.adminUpdate = async (req, res) => {
  const ticketId = Number(req.params.ticketId);
  const status = cleanText(req.body.status, 30).toUpperCase();
  const priority = cleanText(req.body.priority, 20).toUpperCase();
  if (!Number.isInteger(ticketId) || ticketId < 1) return res.status(400).json({ message: 'Invalid ticket ID' });
  if (!STATUSES.has(status) || !PRIORITIES.has(priority)) return res.status(400).json({ message: 'Invalid status or priority' });
  const [result] = await db.execute('UPDATE support_tickets SET status = ?, priority = ? WHERE id = ?', [status, priority, ticketId]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Ticket not found' });
  res.json({ message: 'Ticket updated' });
};
