const db = require('../db');


module.exports = {
  getAllReviews: (page, count, sort, product_id, callback) => {

    var queryStr = 'SELECT * FROM reviews_photos WHERE reviews_photos.product_id=? AND reviews_photos.id>=? AND reviews.id<=? AND reviews_photos.review_id=reviews.id ORDER BY ?';
    var queryParams = [product_id, startingIndex, endingIndex, sortParam];
    db.query(queryStr, queryParams)


    //pull review info
    var startingIndex = count * page;
    var endingIndex = count * page + count;


    var sortParam = '';
    if (sort === "helpful") { sortParam = sort; };
    if (sort === "newest") { sortParam = "date"; };
    if (sort === "relevant") { sortParam = "rating" }
    var queryStr = 'SELECT * FROM reviewstest, reviews_photos WHERE reviews.product_id=? AND reviews.id>=? AND reviewstest.id<=? AND reviews_photos.review_id=reviews.id ORDER BY ?';
    var queryParams = [product_id, startingIndex, endingIndex, sortParam];
    db.query(queryStr, queryParams)
      .then((results) => {
        var reviews = [];

        results.forEach((review) => {
          //photos
          var photos = [];
          var reviewResult = {
            "review_id": review.id,
            "rating": review.rating,
            "summary": review.summary,
            "recommend": review.recommend,
            "response": review.response,
            "body": review.body,
            "date": review.date,
            "reviewer_name": review.reviewer_name,
            "helpfulness": review.helpfulness,
            "photos": photos
          })

        var data = {
          "product": product_id,
          "page": page,
          "count": count,
          "results": [
            results
          ]
        }
        callback(null, data);
      })
      .catch((err) => {
        callback((err, null)
      })
  },
  getAllMeta: (product_id, callback) => {
    var ratings = {};
    var recommended = { 'TRUE': 0, 'FALSE': 0 };
    var characteristics = {};
    var data = {};

    //Find Ratings/Recommended
    var queryStr = 'SELECT rating, recommended FROM reviews WHERE product_id=? ORDER BY rating';
    var queryParams = [product_id];
    db.query(queryStr, queryParams)
      .then((results) => {
        results.forEach((review) => {
          if (ratings.hasOwnProperty(review.rating)) { ratings[review.rating]++; }
          else { ratings[review.rating] = 1; }

          if (recommended.hasOwnProperty(review.recommend)) { recommended[review.recommended]++; }
          else { recommended[review.recommend] = 1; }

        })

        //Find Characteristics
        var queryStr = 'SELECT characteristics.product_id, characteristics.id, characteristic_reviews.characteristic_id, characteristics.name, characteristic_reviews.value  FROM characteristics, characteristic_reviews WHERE characteristics.product_id=? AND characteristics.id=characteristic_reviews.characteristic_id';
        var queryParams = [product_id];
        db.query(queryStr, queryParams)
          .then((results) => {
            var chars = { names: [] }
            results.forEach((charObj) => {
              if (chars.hasOwnProperty(charObj.name)) {
                chars[charObj.name] += charObj.value;
                chars[`${charObj.name}Count`] += 1;
              } else {
                chars.names.push({ name: charObj.name, id: charObj.id });
                chars[charObj.name] = charObj.value;
                chars[`${charObj.name}Count`] = 1;
              }
            })
            var characteristics = {};
            chars.names.forEach((nameObj) => {
              characteristics[nameObj.name] = { id: nameObj.id, value: (chars[nameObj.name] / chars[`${nameObj.name}Count`]) };
            })
            data = { product_id, ratings, recommended, characteristics }
            callback(null, data)
          })
      })
      .catch((err) => {
        console.log('getAllMeta error: ', err)
        callback(err, null)
      })
  },
  addReview: (review, callback) => {
    //create review row
    //get review_id
    //use review_id to add photos and chars

    var columns = '(product_id, rating, summary, body, recommend, reviewer_name, reviewer_email, response)'
    var queryStr = `INSERT INTO reviewstest ${columns} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    var queryParams = [review.product_id, review.rating, review.summary, review.body, review.recommend, review.reviewer_name, review.reviewer_email, review.response];
    db.query(queryStr, queryParams)
      .then((results) => {
        review.photos.forEach((photoObj) => {
          var queryStr = `INSERT INTO reviews_photos (review_id, url) VALUES (?, ?)`;
          var queryParams = [results.review_id, review];
          db.query(queryStr, queryParams)
        })
        reviews.characteristics
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null)
      })
  },
  updateHelpfulness: (review_id, callback) => {
    var queryStr = 'UPDATE reviewstest SET helpfulness=helpfulness+1 WHERE id=?';
    var queryParams = [review_id];
    db.query(queryStr, queryParams)
      .then((results) => {
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null)
      })
  },
  reportReview: (review_id, callback) => {
    var queryStr = 'UPDATE reviewstest SET reported=true WHERE id=?';
    var queryParams = [review_id];
    db.query(queryStr, queryParams)
      .then((results) => {
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null)
      })
  }
}