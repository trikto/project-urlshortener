require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");

const mongoose = require("mongoose");

app.use(cors());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlSchema = mongoose.Schema({
  original_url: String,
  short_url: Number,
});

const Urls = mongoose.model("Urls", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/api/shorturl", (req, res) => {
  var url = req.body.url;

  if (url.includes("?")) {
    url = url.split("?")[0];
  }

  if (url.startsWith("https://") || url.startsWith("http://")) {
    // Check if this is a valid URL
    dnsUrl = url.split("://")[1];
    dns.lookup(dnsUrl, (err, address, family) => {
      if (err) res.json({ error: "Invalid URL" });
      else {
        Urls.findOne({ original_url: url })
          .then((data) => {
            // Check if the URL exists
            if (data) {
              res.json({
                original_url: data.original_url,
                short_url: data.short_url,
              });
            } else {
              // If the URL doesn't exist
              Urls.find()
                .sort({ short_url: -1 })
                .limit(1)
                .then((data) => {
                  var max_num;
                  // console.log(data);
                  if (data.length != 0) {
                    // console.log("data short url", data);
                    max_num = data[0].short_url;
                    // console.log(max_num);
                  } else {
                    max_num = 0;
                  }

                  var short_url = max_num + 1;

                  const Url = new Urls({
                    original_url: url,
                    short_url: short_url,
                  });

                  Url.save()
                    .then((data) => {
                      // console.log(data);
                      res.json({ original_url: url, short_url: short_url });
                    })
                    .catch((err) => console.error(err));
                })
                .catch((err) => console.error(err));
            }
          })
          .catch((err) => console.error(err));
      }
    });
  } else {
    res.json({ error: "Invalid URL" });
  }
});

app.get("/api/shorturl/:short", (req, res) => {
  var id = req.params.short;
  if (!isNaN(id)) {
    id = Number(id);
  }
  // console.log(typeof id, id);
  Urls.findOne({ short_url: id })
    .then((data) => {
      if (data) {
        // console.log(data);
        res.redirect(data.original_url);
      } else {
        res.json({ error: "No short URL found for the given input" });
      }
    })
    .catch((err) => console.error(err));
});

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
