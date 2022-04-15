/* 1. expressモジュールをロードし、インスタンス化してappに代入。*/
let express = require("express");
let app = express();

app.use(express.static("./static"));

app.listen(process.env.PORT || 5050, function(){
    console.log("Serving at 5050")
});
