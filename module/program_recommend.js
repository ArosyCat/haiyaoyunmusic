//推荐节目
// module.exports = (req, res, createWebAPIRequest, request) => {
//   const cookie = req.get("Cookie") ? req.get("Cookie") : "";
//   const data = {
//     cateId: req.query.type,
//     csrf_token: ""
//   };
//   createWebAPIRequest(
//     "music.163.com",
//     "/weapi/program/recommend/v1",
//     "POST",
//     data,
//     cookie,
//     music_req => {
//       res.send(music_req);
//     },
//     err => res.status(502).send("fetch error")
//   );
// };

module.exports = (query, request) => {
    const data = {
        cateId: query.type
    }
    return request(
        'POST', `http://music.163.com/weapi/program/recommend/v1`, data,
        {crypto: 'weapi', cookie: query.cookie, proxy: query.proxy}
    )
}
