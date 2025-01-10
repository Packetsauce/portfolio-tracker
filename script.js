// script.js

const portfolio = [];

// Fetch stock/crypto price
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
  } else {
    alert('Failed to fetch price. Please check the ticker.');
  }
});

// Update portfolio table
function updatePortfolioTable() {
  const tbody = document.querySelector('#portfolio-table tbody');
  tbody.innerHTML = '';

  portfolio.forEach(asset => {
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${asset.ticker}</td>
      <td>${asset.quantity}</td>
      <td>${asset.price.toFixed(2)}</td>
      <td>${(asset.quantity * asset.price).toFixed(2)}</td>
    `;
    
    tbody.appendChild(row);
  });
}

// Save portfolio to JSON file
document.getElementById('save-portfolio').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(portfolio)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portfolio.json';
  
  a.click();
});

// Load portfolio from JSON file
document.getElementById('load-portfolio').addEventListener('change', event => {
  const file = event.target.files[0];
  
  if (file) {
    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        portfolio.length = 0; // Clear existing portfolio
        portfolio.push(...data);
        updatePortfolioTable();
      } catch (error) {
        alert('Invalid file format.');
      }
    };
    
    reader.readAsText(file);
  }
});
