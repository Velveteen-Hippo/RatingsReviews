const db = require('../db');


module.exports = {
  getAllReviews: (page, count, sort, product_id, callback) => {
    //pull review info
    var startingIndex = count * page;

    var sortParam = '';
    if (sort === "helpful") { sortParam = sort; };
    if (sort === "newest") { sortParam = "date"; };
    if (sort === "relevant") { sortParam = "helpfulness, date" }
    var queryStr = '\
    SELECT\
    reviews.id AS review_id,\
    reviews.rating, reviews.summary, reviews.recommend, reviews.response, reviews.body, reviews.date, reviews.reviewer_name, reviews.helpfulness,\
    jsonb_agg(photo) AS photos\
    FROM\
	  (SELECT reviews_photos.id, reviews_photos.url FROM reviews_photos, reviews WHERE reviews_photos.review_id=reviews.id AND reviews.product_id=18078) AS photo,\
	  reviews LEFT JOIN reviews_photos ON reviews.id=reviews_photos.review_id\
 	  WHERE reviews.product_id=?\
	  GROUP BY reviews.id\
    ORDER BY ?\
    LIMIT ? OFFSET ?
    ';
    //still have issue of dupe review enterites for multiple photos
    var queryParams = [product_id, sortParam, count, startingIndex];
    db.query(queryStr, queryParams)
      .then((results) => {
        var data = {
          "product": product_id,
          "page": page,
          "count": count,
          "results": results
        }
        callback(null, data);
      })
      .catch((err) => {
        callback((err, null));
      })
  },
  getAllMeta: (product_id, callback) => {
    var data = {};

    //Find Ratings/Recommended
    //Find Characteristics
    var queryStr = '\
    SELECT\
        jsonb_object_agg(reviews.rating, sumratings.rating) AS ratings,\
        jsonb_object_agg(reviews.recommend, countrecommend.count) AS recommended,\
		jsonb_object_agg(characteristics.name, charObj) AS characteristics\
        FROM \
		reviews, characteristics, characteristic_reviews,\
		(SELECT count(reviews.rating) AS rating FROM reviews WHERE reviews.product_id=18078) AS sumratings,\
		(SELECT count(reviews.recommend) FROM reviews WHERE reviews.product_id=18078 GROUP BY reviews.recommend) AS countrecommend,\
		(SELECT characteristics.id AS id, AVG(characteristic_reviews.value) AS value FROM characteristics, characteristic_reviews, reviews WHERE characteristics.id=characteristic_reviews.characteristic_id AND characteristics.product_id=18078 GROUP BY characteristics.id) AS charObj\
		WHERE characteristics.product_id=?\
        AND reviews.product_id=?\
        AND reviews.id=characteristic_reviews.review_id\
        AND characteristics.id=characteristic_reviews.characteristic_id\
    ';
    var queryParams = [product_id, product_id];
    db.query(queryStr, queryParams)
      .then((results) => {
        callback(null, results)
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
    var queryStr = `INSERT INTO reviews ${columns} VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    var queryParams = [review.product_id, review.rating, review.summary, review.body, review.recommend, review.reviewer_name, review.reviewer_email, review.response];
    db.query(queryStr, queryParams)
      .then((results) => {
        var review_id = results.id;
        review.photos.forEach((photoObj) => {
          var queryStr = `INSERT INTO reviews_photos (review_id, url) VALUES (?, ?)`;
          var queryParams = [review_id, photoObj.url];
          db.query(queryStr, queryParams)
        })
        var keys = Object.keys(review.characteristics);
        keys.forEach((key) => {
          var queryStr = `INSERT INTO characteristics_reviews(characteristic_id, review_id, value) VALUES (?, ?, ?);\
          INSERT INTO characteristics(id, product_id) VALUES (?,?)`;
          var queryParams = [key, review_id, review.characteristics[key].value, key product_id];
          db.query(queryStr, queryParams)
        })
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null))
      })
  },
  updateHelpfulness: (review_id, callback) => {
    var queryStr = 'UPDATE reviews SET helpfulness=helpfulness+1 WHERE id=?';
    var queryParams = [review_id];
    db.query(queryStr, queryParams)
      .then((results) => {
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null))
      })
  },
  reportReview: (review_id, callback) => {
    var queryStr = 'UPDATE reviews SET reported=true WHERE id=?';
    var queryParams = [review_id];
    db.query(queryStr, queryParams)
      .then((results) => {
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null))
      })
  }
}