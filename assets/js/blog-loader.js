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
        images: post['Images'] || '',
        blogNumber: post['Blog#'] || ''
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
  
  for (let i = startIndex; i < endIndex; i++) {
    const post = blogData[i];
    
    // Create blog post HTML
    const postElement = document.createElement('section');
    postElement.id = `post-${i + 1}`;
    
    // Set the base class and add section-bg for alternating posts
    if (i % 2 !== 0) {
      postElement.className = 'portfolio-details section-bg';
    } else {
      postElement.className = 'portfolio-details';
    }
    
    // Prepare images HTML if available
    let imagesHTML = '';
    
    // Check if there's a blog number to look for images in the corresponding folder
    if (post.blogNumber) {
      // Format the blog number with leading zeros (e.g., "45" becomes "0045")
      const formattedBlogNumber = post.blogNumber.toString().padStart(4, '0');
      
      // Set up a placeholder for images that will be loaded asynchronously
      imagesHTML = `
        <div class="col-lg-3">
          <div class="portfolio-details-slider swiper" id="swiper-${post.blogNumber}">
            <div class="swiper-wrapper align-items-center">
              <!-- Images will be loaded here -->
            </div>
            <div class="swiper-pagination"></div>
          </div>
        </div>
      `;
      
      // After the post is added to the DOM, scan for images
      setTimeout(() => {
        scanForImagesInFolder(formattedBlogNumber, postElement);
      }, 100);
    } else if (post.images) {
      // If no blog number, use images from Excel as before
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
            <div class="portfolio-info">
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
  prevButton.innerHTML = '<i class="bi bi-chevron-left"></i>';
  prevButton.title = 'Previous Page';
  prevButton.className = currentPage === 1 ? 'disabled' : '';
  prevButton.setAttribute('aria-label', 'Previous page');
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
  
  // First page button (if not in first few pages)
  if (currentPage > 3 && totalPages > 5) {
    const firstPageLink = document.createElement('a');
    firstPageLink.href = '#';
    firstPageLink.textContent = '1';
    firstPageLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = 1;
      displayBlogPosts();
      setupPagination();
      window.scrollTo(0, 0);
    });
    paginationElement.appendChild(firstPageLink);
    
    // Ellipsis if needed
    if (currentPage > 4) {
      const ellipsis = document.createElement('a');
      ellipsis.className = 'disabled ellipsis';
      ellipsis.innerHTML = '&hellip;';
      paginationElement.appendChild(ellipsis);
    }
  }
  
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
  
  // Last page button (if not in last few pages)
  if (currentPage < totalPages - 2 && totalPages > 5) {
    // Ellipsis if needed
    if (currentPage < totalPages - 3) {
      const ellipsis = document.createElement('a');
      ellipsis.className = 'disabled ellipsis';
      ellipsis.innerHTML = '&hellip;';
      paginationElement.appendChild(ellipsis);
    }
    
    const lastPageLink = document.createElement('a');
    lastPageLink.href = '#';
    lastPageLink.textContent = totalPages;
    lastPageLink.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = totalPages;
      displayBlogPosts();
      setupPagination();
      window.scrollTo(0, 0);
    });
    paginationElement.appendChild(lastPageLink);
  }
  
  // Next button
  const nextButton = document.createElement('a');
  nextButton.href = '#';
  nextButton.innerHTML = '<i class="bi bi-chevron-right"></i>';
  nextButton.title = 'Next Page';
  nextButton.className = currentPage === totalPages ? 'disabled' : '';
  nextButton.setAttribute('aria-label', 'Next page');
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
  // Destroy existing swipers first to prevent duplicates
  if (window.blogSwipers) {
    window.blogSwipers.forEach(swiper => {
      if (swiper && typeof swiper.destroy === 'function') {
        swiper.destroy();
      }
    });
  }
  
  // Initialize new swipers
  window.blogSwipers = [];
  const swipers = document.querySelectorAll('.portfolio-details-slider.swiper');
  
  swipers.forEach(element => {
    // Only initialize if there are slides
    const slides = element.querySelectorAll('.swiper-slide');
    if (slides.length > 0) {
      const swiper = new Swiper(element, {
        loop: true,
        pagination: {
          el: element.querySelector('.swiper-pagination'),
          clickable: true,
        },
        autoplay: {
          delay: 5000,
        },
      });
      
      window.blogSwipers.push(swiper);
    }
  });
}

// Function to scan for images in a folder
function scanForImagesInFolder(blogNumber, postElement) {
  console.log(`Scanning for images in blog/img/${blogNumber}/`);
  
  // Get a list of all files in the folder
  // Since we can't directly list files in a directory from the browser,
  // we'll try to load images with common naming patterns
  
  // First, try to load a sample image to see if the folder exists
  const testImage = new Image();
  testImage.onload = function() {
    // Folder exists and contains at least one image
    console.log(`Found images in blog/img/${blogNumber}/`);
    loadAllImagesInFolder(blogNumber, postElement);
  };
  
  testImage.onerror = function() {
    // Folder doesn't exist or doesn't contain this image
    console.log(`No images found in blog/img/${blogNumber}/`);
    
    // Check if there are images in the Excel data
    const postIndex = Array.from(document.querySelectorAll('.portfolio-details')).indexOf(postElement);
    if (postIndex >= 0 && blogData[postIndex].images) {
      updateImagesFromExcel(blogData[postIndex].images, postElement);
    }
  };
  
  // Try to load a sample image
  testImage.src = `blog/img/${blogNumber}/${blogNumber}_01.jpg`;
}

// Function to load all images in a folder
function loadAllImagesInFolder(blogNumber, postElement) {
  // Find the swiper container
  const swiperContainer = postElement.querySelector(`#swiper-${blogNumber} .swiper-wrapper`);
  
  if (!swiperContainer) {
    console.error(`Swiper container not found for blog #${blogNumber}`);
    return;
  }
  
  // Clear any existing content
  swiperContainer.innerHTML = '';
  
  // Get all files in the folder
  // Since we can't list directory contents directly, we'll try common patterns
  const imageUrls = [];
  
  // Check for images in the folder
  const checkImage = (url) => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };
  
  // Try different naming patterns
  const promises = [];
  
  // Try pattern: folder/*.jpg (all files in folder)
  // Since we can't directly check this, we'll try specific patterns
  
  // Pattern 1: folder/foldername_XX.jpg (e.g., 0045/0045_01.jpg)
  for (let i = 1; i <= 20; i++) {
    const num = i.toString().padStart(2, '0');
    promises.push(checkImage(`blog/img/${blogNumber}/${blogNumber}_${num}.jpg`));
    promises.push(checkImage(`blog/img/${blogNumber}/${blogNumber}_${num}.jpeg`));
    promises.push(checkImage(`blog/img/${blogNumber}/${blogNumber}_${num}.png`));
  }
  
  // Pattern 2: folder/anyname00001.jpg (e.g., 0045/anyname00001.jpg)
  for (let i = 1; i <= 20; i++) {
    const num = i.toString().padStart(5, '0');
    promises.push(checkImage(`blog/img/${blogNumber}/*${num}.jpg`));
    promises.push(checkImage(`blog/img/${blogNumber}/*${num}.jpeg`));
    promises.push(checkImage(`blog/img/${blogNumber}/*${num}.png`));
  }
  
  // Pattern 3: Try specific files we found in the example
  if (blogNumber === '0045') {
    promises.push(checkImage(`blog/img/0045/MathAndBeerBogota_VivianaMarquez00001.jpeg`));
    promises.push(checkImage(`blog/img/0045/MathAndBeerBogota_VivianaMarquez00002.jpg`));
    promises.push(checkImage(`blog/img/0045/MathAndBeerBogota_VivianaMarquez00003.jpg`));
    promises.push(checkImage(`blog/img/0045/MathAndBeerBogota_VivianaMarquez00004.jpg`));
  }
  
  if (blogNumber === '0050') {
    promises.push(checkImage(`blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00001.png`));
    promises.push(checkImage(`blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00002.jpeg`));
    promises.push(checkImage(`blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00003.jpeg`));
    promises.push(checkImage(`blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00004.jpeg`));
    promises.push(checkImage(`blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00005.jpeg`));
    promises.push(checkImage(`blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00006.jpeg`));
  }
  
  // Process all the image check promises
  Promise.all(promises)
    .then(results => {
      const validUrls = results.filter(url => url !== null);
      
      if (validUrls.length > 0) {
        // Add each image to the swiper
        validUrls.forEach(url => {
          const slide = document.createElement('div');
          slide.className = 'swiper-slide';
          
          const img = document.createElement('img');
          img.src = url;
          img.alt = '';
          img.loading = 'lazy';
          
          slide.appendChild(img);
          swiperContainer.appendChild(slide);
        });
        
        // Initialize or update the Swiper
        reinitializeSwiper();
      } else {
        console.log(`No images found with common patterns in blog/img/${blogNumber}/`);
        
        // Check if there are images in the Excel data
        const postIndex = Array.from(document.querySelectorAll('.portfolio-details')).indexOf(postElement);
        if (postIndex >= 0 && blogData[postIndex].images) {
          updateImagesFromExcel(blogData[postIndex].images, postElement);
        }
      }
    });
}

// Function to update images from Excel data
function updateImagesFromExcel(imagesString, postElement) {
  const imageUrls = imagesString.split(',').map(url => url.trim());
  
  if (imageUrls.length > 0 && imageUrls[0] !== '') {
    // Find the swiper container
    const swiperContainer = postElement.querySelector('.swiper-wrapper');
    
    if (!swiperContainer) {
      console.error('Swiper container not found');
      return;
    }
    
    // Clear any existing content
    swiperContainer.innerHTML = '';
    
    // Add each image to the swiper
    imageUrls.forEach(url => {
      const slide = document.createElement('div');
      slide.className = 'swiper-slide';
      
      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      
      slide.appendChild(img);
      swiperContainer.appendChild(slide);
    });
    
    // Initialize or update the Swiper
    reinitializeSwiper();
  }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
  fetchBlogData();
}); 