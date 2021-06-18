const express = require("express");
const app = express();
const path = require("path");
const fetch = require("node-fetch");

const PORT = process.env.PORT || 9000;

// view engine setup
app.set("views", path.join(__dirname, "public"));
app.set("view engine", "ejs");

//setup public folder
app.use(express.static("./public"));

// setup body-parser urlencoded
app.use(express.urlencoded({ extended: true }));

//Define routes
app.use("/", require("./routes/admin"));
app.use("/", require("./routes/visitor"));
app.use("/", require("./routes/guest"));

// News Api
const newsURL =
  "https://newsapi.org/v2/everything?q=computer+student+education&apiKey=" +
  process.env.NEWS_API_KEY;

app.get("/", async (req, res) => {
  try {
    const response = await fetch(newsURL);
    const data = await response.json();

    let news = data.articles;
    if (!news) {
      news = [];
    } else {
      news = news.filter(article => article.urlToImage !== null);
      if (news.length > 30) {
        news = news.splice(0, 30);
      }
    }
    //res.send(news);
    res.render("index.ejs", {
      key: process.env.CHATRA_KEY,
      news,
    });
  } catch (error) {
    console.log(error);
    res.send("Internal Server Error");
  }
});

//invalid routes
app.get("*", (req, res) => {
  res.render("notFound.ejs", { key: process.env.CHATRA_KEY });
});

app.listen(PORT, () => {
  console.log("Server started at localhost ", PORT);
});
