exports.getPrivateData = (req, res, next) => {
  res.status(200).json({
    success: true,
    data: "Authorize to access private route",
  });
};
