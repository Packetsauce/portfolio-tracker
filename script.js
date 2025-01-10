const portfolio = [];

// Fetch current price for stock or crypto
async function fetchPrice(ticker) {
  try {
    let url = '';
    if (ticker.includes('-USD')) { // Crypto (Coinbase)
      url = `https://api.coinbase.com/v2/prices/${ticker}/spot`;
      const response = await fetch(url);
      const data = await response.json();
      return parseFloat(data.data.amount);
    } else { // Stock (Yahoo Finance)
      url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;
      const response = await fetch(url);
      const data = await response.json();
      return parseFloat(data.quoteResponse.result[0].regularMarketPrice);
    }
  } catch (error) {
    console.error('Error fetching price:', error);
    return null;
  }
}

// Fetch historical prices for performance analysis
async function fetchHistoricalPrices(ticker) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 30);

  const start = Math.floor(startDate.getTime() / 1000);
  const end = Math.floor(endDate.getTime() / 1000);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&period1=${start}&period2=${end}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.chart.result[0].indicators.quote[0].close; // Array of closing prices
  } catch (error) {
    console.error(`Error fetching historical prices for ${ticker}:`, error);
    return [];
  }
}

// Add asset to portfolio
document.getElementById('add-asset').addEventListener('click', async () => {
  const ticker = document.getElementById('ticker').value.toUpperCase();
  const quantity = parseFloat(document.getElementById('quantity').value);

  if (!ticker || isNaN(quantity)) {
    alert('Please enter valid ticker and quantity.');
    return;
  }

  const price = await fetchPrice(ticker);
  
  if (price !== null) {
    portfolio.push({ ticker, quantity, price });
    updatePortfolioTable();
    document.getElementById('ticker').value = '';
    document.getElementById('quantity').value = '';
    runAnalyzer();
  } else {
    alert('Failed to fetch price. Please check the ticker.');
  }
});

// Update portfolio table
function updatePortfolioTable() {
  const tbody = document.querySelector('#portfolio-table tbody');
  
// Include Performance & Volatility Logic Here

// Calculate standard deviation of daily returns
function calculateStandardDeviation(returns) {
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  
  const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
  
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / returns.length);
}

// Calculate portfolio volatility
async function calculateVolatility() {
  let dailyReturns = [];

  for (const asset of portfolio) {
    const prices = await fetchHistoricalPrices(asset.ticker);
    
    if (prices.length > 1) {
      for (let i = 1; i < prices.length; i++) {
        dailyReturns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
    }
  }

  const volatility = calculateStandardDeviation(dailyReturns);
  
  document.getElementById('volatility-data').textContent =
    `The portfolio's volatility (std dev of daily returns) is ${volatility.toFixed(4)}.`;
}

// Fetch valuation metrics for a stock
async function fetchValuationMetrics(ticker) {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    const stockData = data.quoteResponse.result[0];
    
    return {
      peRatio: stockData.trailingPE,
      pbRatio: stockData.priceToBook,
      industryAvgPE: stockData.industryPE || 'N/A', // Replace with actual data if available
      industryAvgPB: stockData.industryPB || 'N/A' // Replace with actual data if available
    };
    
  } catch (error) {
    console.error(`Error fetching valuation metrics for ${ticker}:`, error);
    return null;
  }
}

// Analyze valuation for each stock
async function analyzeValuation() {
  const tbody = document.querySelector('#valuation-table tbody');
  
  tbody.innerHTML = ''; // Clear previous data
  
  for (const asset of portfolio) {
    const metrics = await fetchValuationMetrics(asset.ticker);
    
    if (metrics) {
      const status =
        metrics.peRatio && metrics.industryAvgPE && metrics.peRatio > metrics.industryAvgPE
          ? 'Overvalued'
          : 'Undervalued';
      
      const row = `
        <tr>
          <td>${asset.ticker}</td>
          <td>${metrics.peRatio || 'N/A'}</td>
          <td>${metrics.pbRatio || 'N/A'}</td>
          <td>${metrics.industryAvgPE || 'N/A'}</td>
          <td>${metrics.industryAvgPB || 'N/A'}</td>
          <td>${status}</td>
        </tr>`;
      
      tbody.innerHTML += row;
    }
  }
}
// Run all analyzer functions when the page loads or when the portfolio updates
async function runAnalyzer() {
  await calculatePerformance();
  await calculateVolatility();
  await analyzeValuation();
}

// Call this after adding/removing assets from the portfolio or on page load
runAnalyzer();
