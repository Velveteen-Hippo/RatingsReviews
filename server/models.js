const db = require('../db');


module.exports = {
  getAllReviews: (page, count, sort, product_id, callback) => {

    var offset = '';
    //pull review info
    if (page !== 1) {
      offset = `OFFSET ${count * (page - 1)};`
    }

    var sortParam = '';
    if (sort === "helpful") { sortParam = "helpfulness"; };
    if (sort === "newest") { sortParam = "date"; };
    if (sort === "relevant") { sortParam = "helpfulness, date" }
    var queryStr = `\
    SELECT\
    reviews.id AS review_id,\
    reviews.rating, \
    reviews.summary, \
    reviews.recommend,\
    reviews.response, \
    reviews.body, \
    reviews.date, \
    reviews.reviewer_name, \
    reviews.helpfulness,\
    photo.photos\
  FROM\
    reviews \
  LEFT JOIN \
    (\
      SELECT \
        reviews_photos.review_id as review_id,\
        jsonb_agg(json_build_object('id', reviews_photos.id, 'value', reviews_photos.url)) AS photos\
      FROM \
        reviews_photos\
      GROUP BY \
        reviews_photos.review_id \
    ) AS photo \
  ON \
    reviews.id=photo.review_id\
 	WHERE\
    reviews.product_id=${product_id}\
	GROUP BY\
    reviews.id,\
	photo.photos\
  ORDER BY ${sortParam}\
  LIMIT ${count} ${offset}`;
    //still have issue of dupe review enterites for multiple photos
    db.query(queryStr)
      .then((results) => {
        var data = {
          "product": product_id,
          "page": page,
          "count": count,
          "results": results.rows
        }
        callback(null, data);
      })
      .catch((err) => {
        callback((err, null));
      })
  },
  getAllMeta: (product_id, callback) => {
    //Find Ratings/Recommended
    //Find Characteristics
    var queryStr = `\
    SELECT\
        reviews.product_id,
        jsonb_object_agg(sumratings.rating, sumratings.count) AS ratings,\
        jsonb_object_agg(countrecommend.recommend, countrecommend.count) AS recommended,\
		jsonb_object_agg(charObj.name, json_build_object(charObj.id, charObj.value))\
        FROM \
		reviews, characteristics, characteristic_reviews, \
		(SELECT reviews.rating, count(reviews.rating) AS count FROM reviews WHERE reviews.product_id=18078 GROUP BY reviews.rating) AS sumratings, \
		(SELECT reviews.recommend, count(reviews.recommend) FROM reviews WHERE reviews.product_id=18078 GROUP BY reviews.recommend) AS countrecommend, \
		(SELECT characteristics.id AS id, characteristics.name, AVG(characteristic_reviews.value) AS value FROM characteristics, characteristic_reviews, reviews WHERE characteristics.id=characteristic_reviews.characteristic_id AND characteristics.product_id=${product_id} GROUP BY characteristics.id) AS charObj \
		WHERE characteristics.product_id=${product_id} \
        AND reviews.product_id=${product_id} \
        AND reviews.id=characteristic_reviews.review_id \
        AND characteristics.id=characteristic_reviews.characteristic_id \
        GROUP BY reviews.product_id
    `;
    db.query(queryStr)
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
    var queryStr = `INSERT INTO reviews ${columns} VALUES (${review.product_id}, ${review.rating}, ${review.summary}, ${review.body}, ${review.recommend}, ${review.reviewer_name}, ${review.reviewer_email}, ${review.response}) RETURNING id`;
    db.query(queryStr)
      .then((results) => {
        var review_id = results.rows[0].id;
        review.photos.forEach((photoObj) => {
          var queryStr = `INSERT INTO reviews_photos (review_id, url) VALUES (${review_id}, ${photoObj.url})`;
          db.query(queryStr)
        })
        var keys = Object.keys(review.characteristics);
        keys.forEach((key) => {
          var queryStr = `INSERT INTO characteristics_reviews(characteristic_id, review_id, value) VALUES ($1, $2, $3);\
          INSERT INTO characteristics(id, product_id) VALUES (?,?)`;
          var queryParams = [key, review_id, review.characteristics[key].value, key, product_id];
          db.query(queryStr, queryParams)
        })
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null))
      })
  },
  updateHelpfulness: (review_id, callback) => {
    var queryStr = `UPDATE reviews SET helpfulness=helpfulness+1 WHERE id=${review_id}`;
    db.query(queryStr)
      .then((results) => {
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null))
      })
  },
  reportReview: (review_id, callback) => {
    var queryStr = `UPDATE reviews SET reported=true WHERE id=${review_id}`;
    db.query(queryStr)
      .then((results) => {
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null))
      })
  }
}