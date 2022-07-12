const express = require("express");
const app = express();
const fs = require("fs");
const bodyParser = require("body-parser");
const Db = require("mongodb/lib/db");
const methodOverride = require("method-override");
app.use(bodyParser.urlencoded({ extended: true }));

const MongoClient = require("mongodb").MongoClient;
app.use("/public", express.static("public"));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
require("dotenv").config();

MongoClient.connect(
  "mongodb+srv://baedonguri:YxEazAKyJVmZQZZp@cluster0.75w8z.mongodb.net/todoapp?retryWrites=true&w=majority",
  function (error, client) {
    // 연결되면 할 일
    if (error) return console.log(error);

    db = client.db("todoapp"); // todoapp 이라는 database(폴더)에 연결좀요
    // 1: 서버띄울 포트번호, 2: 띄운 후 실행할 코드
    app.listen(8080, function () {
      console.log("listening on 8080");
    });
  }
);

MongoClient.connect(process.env.DB_URL, function (error, client) {
  // 연결되면 할 일
  if (error) return console.log(error);

  db = client.db("todoapp"); // todoapp 이라는 database(폴더)에 연결좀요
  // 1: 서버띄울 포트번호, 2: 띄운 후 실행할 코드
  app.listen(process.env.PORT, function () {
    console.log("listening on 8080");
  });
});

app.get("/", function (req, res) {
  res.render("index.ejs");
});

app.get("/write", function (req, res) {
  res.render("write.ejs");
});

// 게시글 발행하기
app.post("/add", function (req, res) {
  res.send("전송완료");
  const title = req.body.title;
  const date = req.body.date;
  db.collection("counter").findOne(
    { name: "게시물갯수" },
    function (error, result) {
      const _id = result.totalPost;

      db.collection("post").insertOne(
        { _id: _id + 1, 제목: title, 날짜: date },
        function (error, result) {
          console.log("저장완료!");
        }
      );
      db.collection("counter").updateOne(
        { name: "게시물갯수" },
        { $inc: { totalPost: 1 } },
        function (error, result) {
          if (error) {
            return console.log(error);
          }
        }
      );
    }
  );
});

// 게시글 화면에 띄워주기 위해 데이터 list.ejs로 보내기
app.get("/list", function (req, res) {
  db.collection("post")
    .find()
    .toArray(function (error, result) {
      // console.log(result);
      res.render("list.ejs", { posts: result });
    });
});

app.delete("/delete", function (req, res) {
  req.body._id = parseInt(req.body._id);
  db.collection("post").deleteOne(req.body, function (error, result) {
    console.log("삭제완료");
    res.status(200).send({ msg: "성공했습니다" });
  });
  // res.send('삭제완료')
});

app.get("/detail/:id", function (req, res) {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    function (error, result) {
      console.log(result);
      res.render("detail.ejs", { data: result });
    }
  );
});

app.get("/edit/:id", function (req, res) {
  db.collection("post").findOne(
    { _id: parseInt(req.params._id) },
    function (error, result) {
      console.log(result);
      res.render("edit.ejs", { data: result });
    }
  );
});

app.put("/edit", function (req, res) {
  const target_id = parseInt(req.body.id);
  // form에 담긴 제목, 날짜 데이터를 db에서 업데이트를 해준다.
  db.collection("post").updateOne(
    { _id: target_id },
    { $set: { 제목: req.body.title, 날짜: req.body.date } },
    function (error, result) {
      console.log("수정완료");
      res.redirect("/list");
    }
  );
});

/* 로그인 기능 */

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");

// app use => 미들웨어. 웹서버는 요청-응답해주는 머신임
// 미들웨어는 : 요청 - 응답 중간에 뭔가를 실행하는 코드
app.use(
  session({ secret: "비밀코드", resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());

// login api
app.get("/login", function (req, res) {
  res.render("login.ejs");
});
// authenticate : 아디 비번 체크 도와줌
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  function (req, res) {
    res.redirect("/");
  }
);

app.get("/mypage", isLogin, function (req, res) {
  res.render("mypage.ejs", { user: req.user });
});

// login 확인을 위한 미들웨어
function isLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send("로그인 하세요");
  }
}

passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (inputId, inputPw, done) {
      //console.log(inputId, inputPw);
      db.collection("login").findOne({ id: inputId }, function (error, result) {
        if (error) return done(error);

        if (!result)
          return done(null, false, { message: "존재하지않는 아이디요" });
        if (inputPw == result.pw) {
          return done(null, result); // done(서버에러, 성공시사용자DB데이터, 에러메시지)
        } else {
          return done(null, false, { message: "비번틀렸어요" });
        }
      });
    }
  )
);

// id를 이용해서 세션을 저장시키는 코드 (로그인 성공시 발동)
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

// 이 세션 데이터를 가진 사람을 DB에서 찾아주세요 (마이페이지 접속시 발동)
passport.deserializeUser(function (id, done) {
  db.collection("login").findOne({ id: id }, function (error, result) {
    if (error) {
      return console.log(error);
    }
    done(null, result);
  });
});
