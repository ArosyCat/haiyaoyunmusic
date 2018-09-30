//登录刷新
// module.exports = (req, res, createWebAPIRequest, request) => {
//   const cookie = req.get("Cookie") ? req.get("Cookie") : "";
//   const data = {
//     csrf_token: ""
//   };
//   createWebAPIRequest(
//     "music.163.com",
//     `/weapi/login/token/refresh`,
//     "POST",
//     data,
//     cookie,
//     (music_req, cookie) => {
//       res.append("Set-Cookie", cookie);
//       res.send(music_req);
//     },
//     err => res.status(502).send("fetch error")
//   );
// };

module.exports = (query, request) => {
    return request(
        'POST', `http://music.163.com/weapi/login/token/refresh`, {},
        {crypto: 'weapi', cookie: query.cookie, proxy: query.proxy}
    )
}