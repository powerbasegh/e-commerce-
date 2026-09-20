require('dotenv').config();
const app = require('./app');
const { startReservationSweeper } = require('./services/reservationService');

const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => {
  console.log(`PowerBase API listening on ${PORT}`);
  // Returns stock held by orders that were never paid for. Started here
  // rather than in app.js so importing the app (as the test suite does)
  // doesn't spawn a background timer.
  startReservationSweeper();
});
