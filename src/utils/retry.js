async function retry(fn, retries = 3, delay = 2000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    console.log(`🔁 Retry... attempts left: ${retries}`);

    await new Promise(res => setTimeout(res, delay));

    return retry(fn, retries - 1, delay);
  }
}

module.exports = retry;