export default async function metadata(req, res, next) {
  const id = req.params.id;
  const meta = req.meta;
  try {
    res.send({
      metadata: meta.metadata,
      // finalDownload: meta.dl + 1 === meta.dlimit,
      // ttl
    });
  } catch (e) {
    res.sendStatus(404);
  }
}
