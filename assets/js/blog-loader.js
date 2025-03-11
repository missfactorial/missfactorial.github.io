// Blog display configuration
const POSTS_PER_PAGE = 10;
let currentPage = 1;
let totalPosts = 0;
let blogData = [];

// Function to parse CSV data
function parseCSV(text) {
  try {
    // Split the text into lines
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    // Extract headers from the first line
    const headers = lines[0].split(',').map(header => header.trim());
    
    // Process each line (skip the header line)
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      // Handle commas within quoted fields
      const values = [];
      let currentValue = '';
      let insideQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      
      // Add the last value
      values.push(currentValue.trim());
      
      // Create an object with the headers as keys
      const entry = {};
      headers.forEach((header, index) => {
        if (header) { // Only process non-empty headers
          entry[header] = values[index] || '';
        }
      });
      
      // Only add entries with a title or description
      if (entry['Title'] || entry['Description']) {
        data.push(entry);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Failed to parse CSV data: ' + error.message);
  }
}

// Function to fetch blog data from CSV file
async function fetchBlogData() {
  const blogContainer = document.getElementById('blog-container');
  
  try {
    // Since the root path is working for the user, let's try that first
    const response = await fetch('news.csv');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV data: ${response.status} ${response.statusText}`);
    }
    
    const csvText = await response.text();
    
    if (!csvText || csvText.trim() === '') {
      throw new Error('CSV file is empty');
    }
    
    console.log('CSV data loaded successfully');
    
    blogData = parseCSV(csvText);
    
    if (blogData.length === 0) {
      throw new Error('No valid blog posts found in CSV');
    }
    
    console.log(`Parsed ${blogData.length} blog posts from CSV`);
    
    // Map CSV columns to our expected format
    blogData = blogData.map(post => {
      return {
        title: post['Title'] || 'Untitled Post',
        date: post['Date'] || '',
        location: post['Location'] || (post['City'] ? post['City'] : ''),
        content: post['Description'] || '',
        type: post['Type'] || '',
        organization: post['Organization/Event'] || '',
        // We'll handle images separately if they exist in the CSV
        images: post['Images'] || ''
      };
    });
    
    // Sort by date (newest first)
    blogData.sort((a, b) => {
      const dateA = new Date(a.date || '');
      const dateB = new Date(b.date || '');
      return dateB - dateA;
    });
    
    totalPosts = blogData.length;
    
    // Display the first page of posts
    displayBlogPosts();
    setupPagination();
    
  } catch (error) {
    console.error('Error fetching blog data:', error);
    blogContainer.innerHTML = `
      <div class="alert alert-danger">
        Failed to load blog posts. Please try again later.<br>
        <small>Error details: ${error.message}</small>
      </div>
    `;
  }
}

// Function to display blog posts for the current page
function displayBlogPosts() {
  const blogContainer = document.getElementById('blog-container');
  blogContainer.innerHTML = '';
  
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = Math.min(startIndex + POSTS_PER_PAGE, totalPosts);
  
  if (totalPosts === 0) {
    blogContainer.innerHTML = '<div class="alert alert-info">No blog posts found.</div>';
    return;
  }
  
  for (let i = startIndex; i < endIndex; i++) {
    const post = blogData[i];
    
    // Create blog post HTML
    const postElement = document.createElement('section');
    postElement.id = `post-${i + 1}`;
    postElement.className = 'portfolio-details';
    postElement.classList.add(i % 2 === 0 ? '' : 'section-bg');
    
    // Prepare images HTML if available
    let imagesHTML = '';
    if (post.images) {
      const imageUrls = post.images.split(',').map(url => url.trim());
      if (imageUrls.length > 0) {
        imagesHTML = `
          <div class="col-lg-3">
            <div class="portfolio-details-slider swiper">
              <div class="swiper-wrapper align-items-center">
                ${imageUrls.map(url => `
                  <div class="swiper-slide">
                    <img src="${url}" alt="" loading="lazy">
                  </div>
                `).join('')}
              </div>
              <div class="swiper-pagination"></div>
            </div>
          </div>
        `;
      }
    }
    
    // Create content HTML
    postElement.innerHTML = `
      <div class="container" data-aos="fade-up">
        <div class="row gy-4">
          ${imagesHTML}
          <div class="col-lg-${imagesHTML ? '8' : '12'}">
            <div class="portfolio-info" style="background-color: white">
              <h3>${post.title || 'Untitled Post'}</h3>
              <ul>
                ${post.type ? `<li><strong>Type</strong>: ${post.type}</li>` : ''}
                ${post.date ? `<li><strong>Date</strong>: ${post.date}</li>` : ''}
                ${post.location ? `<li><strong>Location</strong>: ${post.location}</li>` : ''}
                ${post.organization ? `<li><strong>Organization</strong>: ${post.organization}</li>` : ''}
                <br>
                ${post.content ? post.content.replace(/\n/g, '<br><br>') : 'No content available.'}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
    
    blogContainer.appendChild(postElement);
  }
  
  // Reinitialize Swiper if there are any sliders
  if (document.querySelector('.swiper')) {
    reinitializeSwiper();
  }
}

// Function to set up pagination
function setupPagination() {
  const paginationElement = document.getElementById('pagination');
  const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);
  
  if (totalPages <= 1) {
    paginationElement.style.display = 'none';
    return;
  }
  
  paginationElement.style.display = 'flex';
  paginationElement.innerHTML = '';
  
  // Previous button
  const prevButton = document.createElement('a');
  prevButton.href = '#';
  prevButton.innerHTML = '&laquo;';
  prevButton.className = currentPage === 1 ? 'disabled' : '';
  prevButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      displayBlogPosts();
      setupPagination();
      window.scrollTo(0, 0);
    }
  });
  paginationElement.appendChild(prevButton);
  
  // Page numbers
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const pageLink = document.createElement('a');
    pageLink.href = '#';
    pageLink.textContent = i;
    pageLink.className = i === currentPage ? 'active' : '';
    pageLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = i;
      displayBlogPosts();
      setupPagination();
      window.scrollTo(0, 0);
    });
    paginationElement.appendChild(pageLink);
  }
  
  // Next button
  const nextButton = document.createElement('a');
  nextButton.href = '#';
  nextButton.innerHTML = '&raquo;';
  nextButton.className = currentPage === totalPages ? 'disabled' : '';
  nextButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      displayBlogPosts();
      setupPagination();
      window.scrollTo(0, 0);
    }
  });
  paginationElement.appendChild(nextButton);
}

// Function to reinitialize Swiper
function reinitializeSwiper() {
  const swipers = document.querySelectorAll('.swiper');
  swipers.forEach(element => {
    new Swiper(element, {
      loop: true,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      autoplay: {
        delay: 5000,
      },
    });
  });
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
  fetchBlogData();
}); 