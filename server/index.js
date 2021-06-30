const express = require('express');
const path = require('path');
const axios = require('axios');
const models = require('./models.js')

const PORT = 3000;

var app = express();
app.use(express.json());
app.use(express.urlencoded());


app.get('/reviews', (req, res) => {
  models.getAllReviews(req.query.page, req.query.count, req.query.sort, req.query.product_id, (err, results) => {
    if (err) {
      console.log('S: get/reviews getAllReviews err: ', err);
    } else {
      res.status(200).send(results)
    }
  })
})

app.get('/reviews/meta', (req, res) => {
  models.getAllMeta(req.query.product_id, (err, results) => {
    if (err) {
      console.log('S: get/reviews getAllMeta err: ', err);
    } else {
      res.status(200).send(results.rows[0])
    }
  })
})

app.post('/reviews', (req, res) => {
  var review = {
    product_id: req.body.product_id,
    rating: req.body.rating,
    summary: req.body.summary,
    body: req.body.body,
    recommend: req.body.recommend,
    reviewer_name: req.body.name,
    reviewer_email: req.body.email,
    photos: req.body.photos,
    characteristics: req.body.characteristics
  }
  // console.log('S: review: ', req.body)
  models.addReview(review, (err, results) => {
    if (err) {
      console.log('S: get/reviews addReview err: ', err);
    } else {
      console.log('S: get/reviews addReview success');
      res.status(201).send(results)
    }
  })
})

app.put('/reviews/:review_id/helpful', (req, res) => {
  models.updateHelpfulness(req.params.review_id, (err, results) => {
    if (err) {
      console.log('S: get/reviews updateHelpfulness err: ', err);
    } else {
      res.status(204).send(results)
    }
  })
})

app.put('/reviews/:review_id/report', (req, res) => {
  models.reportReview(req.params.review_id, (err, results) => {
    if (err) {
      console.log('S: get/reviews reportReview err: ', err);
    } else {
      res.status(204).send(results)
    }
  })
})

app.listen(PORT, () => {
  console.log('listening on port ' + PORT);
});