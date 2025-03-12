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
      // Log the raw data to see what's available
      console.log('Raw blog post data:', post);
      
      // Check for Blog# column with different possible names
      const blogNumber = post['Blog#'] || post['Blog #'] || post['BlogNumber'] || post['Blog Number'] || '';
      console.log('Extracted Blog#:', blogNumber);
      
      return {
        title: post['Title'] || 'Untitled Post',
        date: post['Date'] || '',
        location: post['Location'] || (post['City'] ? post['City'] : ''),
        content: post['Description'] || '',
        type: post['Type'] || '',
        organization: post['Organization/Event'] || '',
        images: post['Images'] || '',
        blogNumber: blogNumber
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
  
  console.log(`Displaying blog posts from ${startIndex + 1} to ${endIndex} (total: ${totalPosts})`);
  
  // Force a consistent pattern by always starting with white background on each page
  for (let i = startIndex; i < endIndex; i++) {
    const post = blogData[i];
    const relativeIndex = i - startIndex; // Position on the current page (0-based)
    
    console.log(`Processing post #${i + 1} (relative index: ${relativeIndex}):`, post.title);
    console.log(`Blog# value:`, post.blogNumber);
    
    // Create blog post HTML
    const postElement = document.createElement('section');
    postElement.id = `post-${i + 1}`;
    
    // Set the base class and add section-bg for alternating posts
    // Always start with white background (no section-bg) for the first post on each page
    if (relativeIndex % 2 === 1) { // Odd relative index (second, fourth, etc. on the page)
      postElement.className = 'portfolio-details section-bg';
      console.log(`Post ${i + 1} gets colored background (relative index: ${relativeIndex})`);
    } else { // Even relative index (first, third, etc. on the page)
      postElement.className = 'portfolio-details section-bg-alt';
      console.log(`Post ${i + 1} gets white background (relative index: ${relativeIndex})`);
    }
    
    // Determine if this post has images
    let hasImages = false;
    let imagesHTML = '';
    
    // Check if there's a blog number to look for images in the corresponding folder
    if (post.blogNumber && (post.blogNumber === '45' || post.blogNumber === '50' || 
                           post.blogNumber === '0045' || post.blogNumber === '0050')) {
      console.log(`Post has Blog# value: ${post.blogNumber} - Will have images`);
      hasImages = true;
      
      // Format the blog number with leading zeros (e.g., "45" becomes "0045")
      const formattedBlogNumber = post.blogNumber.toString().padStart(4, '0');
      console.log(`Formatted Blog# value: ${formattedBlogNumber}`);
      
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
        console.log(`Scanning for images for blog #${formattedBlogNumber}`);
        scanForImagesInFolder(formattedBlogNumber, postElement);
      }, 100);
    } else if (post.images) {
      console.log(`Post has images from Excel:`, post.images);
      
      // If no blog number, use images from Excel as before
      const imageUrls = post.images.split(',').map(url => url.trim());
      if (imageUrls.length > 0 && imageUrls[0] !== '') {
        hasImages = true;
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
    } else {
      console.log(`Post has no Blog# value or images - Using full width`);
      hasImages = false;
    }
    
    // Create content HTML with appropriate column width
    const contentColumnClass = hasImages ? 'col-lg-8' : 'col-lg-12';
    console.log(`Using content column class: ${contentColumnClass} for post: ${post.title}`);
    
    postElement.innerHTML = `
      <div class="container" data-aos="fade-up">
        <div class="row gy-4">
          ${hasImages ? imagesHTML : ''}
          <div class="${contentColumnClass}">
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
  // Set only the pagination class, not section-bg-alt
  paginationElement.className = 'pagination';
  
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
      // Clear the blog container before displaying new posts
      document.getElementById('blog-container').innerHTML = '';
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
      // Clear the blog container before displaying new posts
      document.getElementById('blog-container').innerHTML = '';
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
      // Clear the blog container before displaying new posts
      document.getElementById('blog-container').innerHTML = '';
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
      // Clear the blog container before displaying new posts
      document.getElementById('blog-container').innerHTML = '';
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
      // Clear the blog container before displaying new posts
      document.getElementById('blog-container').innerHTML = '';
      displayBlogPosts();
      setupPagination();
      window.scrollTo(0, 0);
    }
  });
  paginationElement.appendChild(nextButton);
}

// Function to reinitialize Swiper
function reinitializeSwiper() {
  console.log('Reinitializing swipers...');
  
  // Destroy existing swipers first to prevent duplicates
  if (window.blogSwipers) {
    console.log(`Destroying ${window.blogSwipers.length} existing swipers`);
    window.blogSwipers.forEach(swiper => {
      if (swiper && typeof swiper.destroy === 'function') {
        swiper.destroy();
      }
    });
  }
  
  // Initialize new swipers
  window.blogSwipers = [];
  const swipers = document.querySelectorAll('.portfolio-details-slider.swiper');
  console.log(`Found ${swipers.length} swiper elements`);
  
  swipers.forEach((element, index) => {
    console.log(`Processing swiper #${index + 1}`);
    
    // Only initialize if there are slides
    const slides = element.querySelectorAll('.swiper-slide');
    console.log(`Swiper #${index + 1} has ${slides.length} slides`);
    
    if (slides.length > 0) {
      try {
        console.log(`Initializing swiper #${index + 1}`);
        const swiper = new Swiper(element, {
          loop: slides.length > 1, // Only loop if there's more than one slide
          pagination: {
            el: element.querySelector('.swiper-pagination'),
            clickable: true,
          },
          autoplay: slides.length > 1 ? {
            delay: 5000,
          } : false, // Only autoplay if there's more than one slide
        });
        
        window.blogSwipers.push(swiper);
        console.log(`Swiper #${index + 1} initialized successfully`);
      } catch (error) {
        console.error(`Error initializing swiper #${index + 1}:`, error);
      }
    } else {
      console.log(`Skipping swiper #${index + 1} (no slides)`);
    }
  });
  
  console.log(`Initialized ${window.blogSwipers.length} swipers`);
}

// Function to scan for images in a folder
function scanForImagesInFolder(blogNumber, postElement) {
  console.log(`Scanning for images in blog/img/${blogNumber}/`);
  
  // We know exactly which blog numbers have images
  if (blogNumber === '0045' || blogNumber === '0050' || 
      blogNumber === '45' || blogNumber === '50') {
    // Format the blog number with leading zeros
    const formattedBlogNumber = blogNumber.toString().padStart(4, '0');
    console.log(`Using direct image loading for known blog #${formattedBlogNumber}`);
    loadKnownImagesForBlog(formattedBlogNumber, postElement);
    return;
  }
  
  // For all other blog numbers, we assume they don't have images
  console.log(`Blog #${blogNumber} is not known to have images - Using full width`);
  adjustContentColumnWidth(postElement, false);
}

// Function to load known images for specific blogs
function loadKnownImagesForBlog(blogNumber, postElement) {
  // Find the swiper container
  const swiperContainer = postElement.querySelector(`#swiper-${blogNumber} .swiper-wrapper`);
  
  if (!swiperContainer) {
    console.error(`Swiper container not found for blog #${blogNumber}`);
    // If swiper container not found, adjust the content column to full width
    adjustContentColumnWidth(postElement, false);
    return;
  }
  
  // Clear any existing content
  swiperContainer.innerHTML = '';
  
  let imageUrls = [];
  
  // Add specific images for each blog
  if (blogNumber === '0045') {
    imageUrls = [
      'blog/img/0045/MathAndBeerBogota_VivianaMarquez00001.jpeg',
      'blog/img/0045/MathAndBeerBogota_VivianaMarquez00002.jpg',
      'blog/img/0045/MathAndBeerBogota_VivianaMarquez00003.jpg',
      'blog/img/0045/MathAndBeerBogota_VivianaMarquez00004.jpg'
    ];
  } else if (blogNumber === '0050') {
    imageUrls = [
      'blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00001.png',
      'blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00002.jpeg',
      'blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00003.jpeg',
      'blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00004.jpeg',
      'blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00005.jpeg',
      'blog/img/0050/ConsulateColombiaChicago_VivianaMarquez_MissFactorialAcademy_CodeYourDreams_BriCaplan00006.jpeg'
    ];
  }
  
  console.log(`Adding ${imageUrls.length} images for blog #${blogNumber}`);
  
  if (imageUrls.length === 0) {
    // If no images, adjust the content column to full width
    adjustContentColumnWidth(postElement, false);
    return;
  }
  
  // Add each image to the swiper
  let successfulImages = 0;
  
  imageUrls.forEach((url, index) => {
    console.log(`Adding image ${index + 1}: ${url}`);
    
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.loading = 'lazy';
    
    // Add error handling for images
    img.onerror = function() {
      console.error(`Failed to load image: ${url}`);
      // Try with a different path
      const altUrl = url.replace('blog/img', '/blog/img');
      console.log(`Trying alternative path: ${altUrl}`);
      img.src = altUrl;
      
      // If that fails too, remove the slide
      img.onerror = function() {
        console.error(`Failed to load image with alternative path: ${altUrl}`);
        slide.remove();
        
        // Check if we have any successful images left
        if (--successfulImages <= 0) {
          // If no successful images, adjust the content column to full width
          adjustContentColumnWidth(postElement, false);
        }
      };
    };
    
    img.onload = function() {
      successfulImages++;
      // Ensure the content column is set to 8 (since we have images)
      adjustContentColumnWidth(postElement, true);
    };
    
    slide.appendChild(img);
    swiperContainer.appendChild(slide);
  });
  
  // Initialize or update the Swiper
  setTimeout(() => {
    console.log(`Initializing swiper for blog #${blogNumber}`);
    reinitializeSwiper();
    
    // Check if we have any slides after initialization
    const slides = swiperContainer.querySelectorAll('.swiper-slide');
    if (slides.length === 0) {
      // If no slides, adjust the content column to full width
      adjustContentColumnWidth(postElement, false);
    }
  }, 500);
}

// Function to adjust the content column width based on whether images are present
function adjustContentColumnWidth(postElement, hasImages) {
  if (!postElement) return;
  
  console.log(`Adjusting column width for post: hasImages=${hasImages}`);
  
  // Find the content column
  const contentColumn = postElement.querySelector('.portfolio-info').parentElement;
  if (contentColumn) {
    // Force the class to be exactly what we want
    contentColumn.setAttribute('class', hasImages ? 'col-lg-8' : 'col-lg-12');
    console.log(`Set content column class to: ${contentColumn.className}`);
  }
  
  // Find the image column if it exists
  const imageColumn = postElement.querySelector('.portfolio-details-slider')?.parentElement;
  if (imageColumn) {
    if (hasImages) {
      // Make sure the image column is visible
      imageColumn.style.display = 'block';
      imageColumn.setAttribute('class', 'col-lg-3');
    } else {
      // Hide the image column completely
      imageColumn.style.display = 'none';
      // Also remove it from the DOM to ensure it doesn't affect layout
      setTimeout(() => {
        try {
          imageColumn.remove();
        } catch (e) {
          console.error('Error removing image column:', e);
        }
      }, 0);
    }
  }
  
  // Force a layout recalculation
  postElement.style.display = 'none';
  setTimeout(() => {
    postElement.style.display = '';
  }, 0);
}

// Function to load all images in a folder
function loadAllImagesInFolder(blogNumber, postElement) {
  // Find the swiper container
  const swiperContainer = postElement.querySelector(`#swiper-${blogNumber} .swiper-wrapper`);
  
  if (!swiperContainer) {
    console.error(`Swiper container not found for blog #${blogNumber}`);
    // If swiper container not found, adjust the content column to full width
    adjustContentColumnWidth(postElement, false);
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
        
        // Adjust the content column width to account for images
        adjustContentColumnWidth(postElement, true);
        
        // Initialize or update the Swiper
        reinitializeSwiper();
      } else {
        console.log(`No images found with common patterns in blog/img/${blogNumber}/`);
        
        // Adjust the content column to full width since no images were found
        adjustContentColumnWidth(postElement, false);
        
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
      // If swiper container not found, adjust the content column to full width
      adjustContentColumnWidth(postElement, false);
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
      
      // Add error handling for images
      img.onerror = function() {
        console.error(`Failed to load image from Excel: ${url}`);
        slide.remove();
        
        // Check if we have any slides left
        if (swiperContainer.querySelectorAll('.swiper-slide').length === 0) {
          // If no slides, adjust the content column to full width
          adjustContentColumnWidth(postElement, false);
        }
      };
      
      img.onload = function() {
        // Ensure the content column is set to 8 (since we have images)
        adjustContentColumnWidth(postElement, true);
      };
      
      slide.appendChild(img);
      swiperContainer.appendChild(slide);
    });
    
    // Initialize or update the Swiper
    reinitializeSwiper();
  } else {
    // No images in Excel data, adjust the content column to full width
    adjustContentColumnWidth(postElement, false);
  }
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
  fetchBlogData();
});