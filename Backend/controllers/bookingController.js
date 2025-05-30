const Booking = require("../models/Booking");
const Event = require("../models/event");

// Create booking
exports.createBooking = async (req, res, next) => {
  try {
    const { eventId, quantity } = req.body;

    // Get event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    // Check if event is approved
    if (event.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Event is not approved for booking"
      });
    }

    // Check ticket availability
    if (event.remainingTickets < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough tickets available"
      });
    }

    // Calculate total price
    const totalPrice = event.price * quantity;

    // Create booking
    const booking = new Booking({
      user: req.user.userId,
      event: eventId,
      quantity,
      totalPrice
    });

    // Update event's remaining tickets
    event.remainingTickets -= quantity;
    await event.save();

    await booking.save();

    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

// Get user's bookings
exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.userId })
      .populate("event", "title date location price")
      .sort("-bookedAt");

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (err) {
    next(err);
  }
};

// Get single booking
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("event", "title date location price");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this booking"
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (err) {
    next(err);
  }
};

// Cancel booking
exports.cancelBooking = async (req, res, next) => {
  try {
    console.log('Received cancel booking request for ID:', req.params.id);
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      console.log('Booking not found for ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: "Booking not found"
      });
    }

    // Check if user owns the booking
    if (booking.user.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking"
      });
    }

    // Check if booking is already cancelled
    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled"
      });
    }

    console.log('Booking status before cancel:', booking.status);
    await booking.cancel();
    console.log('Booking cancelled successfully in model method.');

    res.json({
      success: true,
      message: "Booking cancelled successfully"
    });
  } catch (err) {
    console.error('Error in cancelBooking controller:', err);
    next(err);
  }
};
