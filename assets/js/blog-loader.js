// Blog display configuration
const POSTS_PER_PAGE = 5;
let currentPage = 1;
let totalPosts = 0;
let blogData = [];

// Function to fetch blog data from XLSX file
async function fetchBlogData() {
  const blogContainer = document.getElementById('blog-container');
  
  try {
    // Load the SheetJS library dynamically
    if (typeof XLSX === 'undefined') {
      console.log('Loading SheetJS library...');
      await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
      console.log('SheetJS library loaded successfully');
    }
    
    // Fetch the XLSX file from the blog folder
    console.log('Fetching blog/news.xlsx...');
    const response = await fetch('blog/news.xlsx');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch XLSX data: ${response.status} ${response.statusText}`);
    }
    
    // Convert the response to an ArrayBuffer
    const data = await response.arrayBuffer();
    
    if (!data || data.byteLength === 0) {
      throw new Error('XLSX file is empty');
    }
    
    console.log('XLSX data loaded successfully');
    
    // Parse the XLSX file
    const workbook = XLSX.read(data, { type: 'array' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert the sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (!jsonData || jsonData.length === 0) {
      throw new Error('No data found in XLSX file');
    }
    
    console.log(`Parsed ${jsonData.length} rows from XLSX`);
    
    // Filter out rows without Title or Description
    blogData = jsonData.filter(row => row['Title'] || row['Description']);
    
    if (blogData.length === 0) {
      throw new Error('No valid blog posts found in XLSX');
    }
    
    console.log(`Found ${blogData.length} valid blog posts`);
    
    // Map XLSX columns to our expected format
    blogData = blogData.map(post => {
      return {
        title: post['Title'] || 'Untitled Post',
        date: post['Date'] || '',
        location: post['Location'] || (post['City'] ? post['City'] : ''),
        content: post['Description'] || '',
        type: post['Type'] || '',
        organization: post['Organization/Event'] || '',
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

// Helper function to load a script dynamically
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
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
  
  // Define an array of background colors for alternating posts
  const bgColors = [
    '#f2f1f4', // Light purple-gray (from style.css)
    '#f8f9fa', // Light gray (from blog-pagination.css)
    '#f0f7fa', // Light blue
    '#f7f0fa', // Light purple
    '#f0faf5'  // Light green
  ];
  
  for (let i = startIndex; i < endIndex; i++) {
    const post = blogData[i];
    
    // Create blog post HTML
    const postElement = document.createElement('section');
    postElement.id = `post-${i + 1}`;
    postElement.className = 'portfolio-details';
    
    // Apply alternating background colors
    const colorIndex = (i - startIndex) % bgColors.length;
    postElement.style.backgroundColor = bgColors[colorIndex];
    
    // Prepare images HTML if available
    let imagesHTML = '';
    if (post.images) {
      const imageUrls = post.images.split(',').map(url => url.trim());
      if (imageUrls.length > 0 && imageUrls[0] !== '') {
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