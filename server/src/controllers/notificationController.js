const db = require('../config/db');

exports.listMine = async (req, res) => {
  const [rows] = await db.execute(
    `SELECT id, type, title, message, is_read, created_at
     FROM notifications WHERE user_id = ? ORDER BY created_at DESC`,
    [req.user.id],
  );
  res.json({ notifications: rows });
};

exports.markRead = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'Invalid notification ID' });
  const [result] = await db.execute('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ message: 'Notification not found' });
  res.json({ message: 'Notification marked as read' });
};

exports.markAllRead = async (req, res) => {
  await db.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE', [req.user.id]);
  res.json({ message: 'All notifications marked as read' });
};
