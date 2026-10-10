import db from '../db/index.js';

export const getLocations = (req, res) => {
  try {
    const { city } = req.query;
    const locations = db.getLocations({ city });
    res.json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getLocationById = (req, res) => {
  try {
    const { id } = req.params;
    const location = db.getLocationById(id);
    if (!location) {
      return res.status(404).json({ success: false, error: 'Location not found' });
    }
    res.json({ success: true, data: location });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
