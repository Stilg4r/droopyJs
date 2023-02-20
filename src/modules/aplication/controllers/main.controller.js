const status = async (req, res) => {
  return res
    .status(200)
    .json({
      hasError: false,
      message: 'La API esta funcionando y ejecutandose',
      data: null,
    }).end();
}
module.exports = { status }
