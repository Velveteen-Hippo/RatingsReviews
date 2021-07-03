const db = require('../db');


module.exports = {
  getAllReviews: (page, count, sort, product_id, callback) => {

    var offset = '';
    //pull review info
    if (page >= 1) {
      offset = `OFFSET ${count * (page - 1)};`
    }

    var sortParam = 'helpfulness DESC';
    if (sort === "helpful") { sortParam = "helpfulness DESC"; };
    if (sort === "newest") { sortParam = "date DESC"; };
    if (sort === "relevant") { sortParam = "helpfulness DESC, date DESC" }
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
    reviews.photos\
  FROM\
    reviews \
 	WHERE\
    reviews.product_id=${product_id} AND reviews.reported = false\
	GROUP BY\
    reviews.id\
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
		jsonb_object_agg(charObj.name, json_build_object('id', charObj.id, 'value', charObj.value)) AS characteristics\
        FROM \
		reviews, characteristics, characteristic_reviews, \
		(SELECT reviews.rating, count(reviews.rating) AS count FROM reviews WHERE reviews.product_id=${product_id} GROUP BY reviews.rating) AS sumratings, \
		(SELECT reviews.recommend, count(reviews.recommend) FROM reviews WHERE reviews.product_id=${product_id} GROUP BY reviews.recommend) AS countrecommend, \
		(SELECT id, name, value FROM char_agg WHERE product_id=${product_id} GROUP BY id, name, value) AS charObj \
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
    var review_id;
    var columns = '(product_id, rating, summary, body, recommend, reported, reviewer_name, reviewer_email)'
    var queryStr = `INSERT INTO reviews ${columns} VALUES (${review.product_id}, ${review.rating}, '${review.summary}', '${review.body}', '${review.recommend}', 'false', '${review.reviewer_name}', '${review.reviewer_email}') RETURNING id;`;
    db.query(queryStr)
      .then((results) => {
        review_id = results.rows[0].id;
        if (review.photos.length > 0) {
          console.log('reviews query: ', review.photos.length)
          var values = [];
          review.photos.forEach((photoUrl) => {
            values.push(` (${review_id}, ${photoUrl})`)
          });
          var queryStr = `INSERT INTO reviews_photos(review_id, url) VALUES ` + values.join(',') + `;`;
          console.log('photos query*: ', queryStr);
          db.query(queryStr)
            .then((results) => {
              console.log('photos query');
              var queryStr = `
            ALTER TABLE reviews ADD photos jsonb;\
            UPDATE reviews SET photos = urls.photos\
            FROM (SELECT reviews_photos.review_id, jsonb_agg(json_build_object('id', reviews_photos.id, 'value', reviews_photos.url)) AS photos FROM reviews_photos GROUP BY reviews_photos.review_id) AS urls\
            WHERE reviews.id = urls.review_id
            AND reviews.id = ${review_id};\
            `
              db.query(queryStr)
                .then(() => {
                  console.log('photo query 2');
                  var keys = Object.keys(review.characteristics);
                  if (keys.length > 0) {
                    console.log('3')
                    var values = [];
                    keys.forEach((key) => {
                      values.push(`(${key}, ${review_id}, ${review.characteristics[key]})`);
                    })
                    var queryStr = `INSERT INTO characteristic_reviews(characteristic_id, review_id, value) VALUES ` + values.join(',') + `;`;
                    db.query(queryStr)
                      .then((result) => {
                        console.log('char query');
                        var queryStr = `
              UPDATE char_agg SET value = calc.value
              FROM (SELECT
                char.id, AVG(rc.value) AS value
                FROM characteristics AS char
                INNER JOIN characteristic_reviews AS rc
                ON char.id = rc.characteristic_id
                WHERE product_id = ${review.product_id}
                GROUP BY char.id) AS calc
                WHERE char_agg.id = calc.id;
                `
                        db.query(queryStr)
                          .then((result) => {
                            console.log('char query 2')
                            callback(null, result);
                          })
                          .catch((err) => {
                            callback(err, null);
                          })

                      })
                  } else {
                    callback(null, results);
                  }
                })
                .catch((err) => {
                  callback((err, null))
                })
            })
            .catch((err) => {
              callback((err, null))
            })
        } else {
          var keys = Object.keys(review.characteristics);
          if (keys.length > 0) {
            console.log('3')
            var values = [];
            keys.forEach((key) => {
              values.push(`(${key}, ${review_id}, ${review.characteristics[key]})`);
            })
            var queryStr = `INSERT INTO characteristic_reviews(characteristic_id, review_id, value) VALUES ` + values.join(',') + `;`;
            db.query(queryStr)
              .then((result) => {
                console.log('char query');
                var queryStr = `
              UPDATE char_agg SET value = calc.value
              FROM (SELECT
                char.id, AVG(rc.value) AS value
                FROM characteristics AS char
                INNER JOIN characteristic_reviews AS rc
                ON char.id = rc.characteristic_id
                WHERE product_id = ${review.product_id}
                GROUP BY char.id) AS calc
                WHERE char_agg.id = calc.id;
                `
                db.query(queryStr)
                  .then((result) => {
                    console.log('char query 2')
                    callback(null, result);
                  })
                  .catch((err) => {
                    callback(err, null);
                  })

              })
          } else {
            callback(null, results);
          }
        }
      })
      .catch((err) => {
        callback((err, null))
      })
  },
  updateHelpfulness: (review_id, callback) => {
    var queryStr = `UPDATE reviews SET helpfulness=helpfulness+1 WHERE id=${review_id};`;
    db.query(queryStr)
      .then((results) => {
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null))
      })
  },
  reportReview: (review_id, callback) => {
    var queryStr = `UPDATE reviews SET reported=true WHERE id=${review_id};`;
    db.query(queryStr)
      .then((results) => {
        callback(null, results);
      })
      .catch((err) => {
        callback((err, null))
      })
  }
}