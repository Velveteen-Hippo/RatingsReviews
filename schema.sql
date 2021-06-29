DROP DATABASE IF EXISTS ratings_reviews;
CREATE DATABASE ratings_reviews;
USE ratings_reviews;

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL NOT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL,
  date BIGINT NOT NULL,
  summary VARCHAR NOT NULL,
  body VARCHAR NOT NULL,
  recommend BOOLEAN NOT NULL,
  reported BOOLEAN NOT NULL,
  reviewer_name VARCHAR NOT NULL,
  reviewer_email VARCHAR NOT NULL,
  response VARCHAR NOT NULL,
  helpfulness INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS characteristics (
  id SERIAL NOT NULL,
  product_id INT NOT NULL,
  name VARCHAR NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS features (
	id SERIAL NOT NULL,
	product_id INT NOT NULL,
	feature VARCHAR NOT NULL,
	value VARCHAR NOT NULL,
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS characteristic_reviews (
	id SERIAL NOT NULL,
	characteristic_id SERIAL NOT NULL,
	review_id INT NOT NULL,
	value INT NOT NULL,
	PRIMARY KEY (id),
  FOREIGN KEY(review_id) REFERENCES reviews(id) ON DELETE CASCADE,
  FOREIGN KEY(characteristic_id) REFERENCES characteristics(id)
);

CREATE TABLE IF NOT EXISTS reviews_photos (
	id SERIAL NOT NULL,
	review_id INT NOT NULL,
	url VARCHAR NOT NULL,
	PRIMARY KEY (id),
  FOREIGN KEY(review_id) REFERENCES reviews(id) ON DELETE CASCADE
);



COPY  reviews FROM  '/csvs/reviews.csv' WITH delimiter ','  CSV HEADER;
COPY  characteristics FROM  '/csvs/characteristics.csv' WITH delimiter ','  CSV HEADER;
COPY  features FROM  '/csvs/features.csv' WITH delimiter ','  CSV HEADER;
COPY  characteristic_reviews FROM  '/csvs/characteristic_reviews.csv' WITH delimiter ','  CSV HEADER;
COPY  reviews_photos FROM  '/csvs/reviews_photos.csv' WITH delimiter ','  CSV HEADER;


ALTER TABLE  reviews
  ALTER COLUMN date TYPE TIMESTAMP USING to_timestamp(date / 1000) + ((date % 1000) || ' milliseconds') :: INTERVAL;

ALTER SEQUENCE reviews_id_seq RESTART WITH 5774953;

ALTER SEQUENCE characteristics_id_seq RESTART WITH 3347680;