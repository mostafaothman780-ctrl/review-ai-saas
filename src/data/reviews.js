let reviews = [];

const addReview = (data) => {
  reviews.push({
    id: Date.now(),
    ...data,
  });
};

const getReviews = () => {
  return reviews;
};

module.exports = { addReview, getReviews };