DROP DATABASE IF EXISTS ratings_reviews;
CREATE DATABASE ratings_reviews;
USE ratings_reviews;

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL NOT NULL,
  product_id INT NOT NULL,
  rating INT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  summary VARCHAR(60) NOT NULL,
  body VARCHAR(1000) NOT NULL,
  recommend INT NOT NULL DEFAULT 0,
  reported INT NOT NULL DEFAULT 0,
  reviewer_name VARCHAR(60) NOT NULL,
  reviewer_email VARCHAR(60) NOT NULL,
  response VARCHAR(200) NOT NULL,
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
	PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS reviews_photos (
	id SERIAL NOT NULL,
	review_id INT NOT NULL,
	url VARCHAR NOT NULL,
	PRIMARY KEY (id)
);
