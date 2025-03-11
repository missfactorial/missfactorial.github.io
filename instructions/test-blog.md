# Blog System Test Page

This document explains how to use the test page for the blog system.

## Overview
The test page (`test-blog.html`) allows you to test if your Excel file is loading correctly and if the blog posts are displaying properly. This is particularly useful when troubleshooting issues with your blog system.

## How to Use the Test Page

1. Create a file named `test-blog.html` in the root of your website with the following content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog System Test</title>
  
  <!-- Bootstrap CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
  
  <!-- Blog Pagination CSS -->
  <link href="assets/css/blog-pagination.css" rel="stylesheet">
  
  <!-- SheetJS Library -->
  <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
  
  <style>
    body {
      padding: 20px;
    }
    .header {
      margin-bottom: 30px;
    }
    .test-controls {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Blog System Test</h1>
      <p>This page tests the blog system with XLSX files.</p>
    </div>
    
    <div class="test-controls">
      <h3>Test Controls</h3>
      <button id="loadReal" class="btn btn-primary">Load news.xlsx</button>
      <div id="testStatus" class="mt-3"></div>
    </div>
    
    <div class="row">
      <div class="col-12">
        <!-- Blog Container - Will be populated by JavaScript -->
        <div id="blog-container"></div>
        
        <!-- Pagination -->
        <div id="pagination" class="pagination"></div>
      </div>
    </div>
  </div>
  
  <!-- Vendor JS Files -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.bundle.min.js"></script>
  
  <script>
    // Blog display configuration
    const POSTS_PER_PAGE = 5;
    let currentPage = 1;
    let totalPosts = 0;
    let blogData = [];
    let currentFile = 'blog/news.xlsx';
    
    // Function to fetch blog data from XLSX file
    async function fetchBlogData(xlsxFile) {
      const blogContainer = document.getElementById('blog-container');
      const testStatus = document.getElementById('testStatus');
      
      testStatus.innerHTML = `<div class="alert alert-info">Loading ${xlsxFile}...</div>`;
      
      try {
        // Fetch the XLSX file
        const response = await fetch(xlsxFile);
        
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
        console.log('Sample data:', jsonData.slice(0, 2));
        
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
        
        testStatus.innerHTML = `<div class="alert alert-success">Successfully loaded ${blogData.length} posts from ${xlsxFile}</div>`;
        
      } catch (error) {
        console.error('Error fetching blog data:', error);
        blogContainer.innerHTML = `
          <div class="alert alert-danger">
            Failed to load blog posts. Please try again later.<br>
            <small>Error details: ${error.message}</small>
          </div>
        `;
        testStatus.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
      }
    }
    
    // Function to display blog posts for the current page
    function displayBlogPosts() {
      // ... (implementation details)
    }
    
    // Function to set up pagination
    function setupPagination() {
      // ... (implementation details)
    }
    
    // Set up event listeners for test controls
    document.getElementById('loadReal').addEventListener('click', () => {
      currentFile = 'blog/news.xlsx';
      currentPage = 1;
      fetchBlogData(currentFile);
    });
    
    // Initialize when the document is loaded
    document.addEventListener('DOMContentLoaded', function() {
      fetchBlogData(currentFile);
    });
  </script>
</body>
</html>
```

2. Open the test page in your browser by navigating to `https://yourdomain.com/test-blog.html` or by opening it locally.

3. Click the "Load news.xlsx" button to test loading your Excel file.

4. Check the status message and browser console for any errors.

## Troubleshooting with the Test Page

The test page provides detailed error messages that can help you identify issues with your blog system:

- **HTTP errors (404, 403, etc.)**: These indicate that the Excel file cannot be found or accessed. Make sure the file is in the correct location (`blog/news.xlsx`).

- **Parsing errors**: These indicate that there might be issues with the format of your Excel file. Make sure it's saved as .xlsx and has the correct column headers.

- **Empty data errors**: These indicate that no valid blog posts were found in your Excel file. Make sure you have at least one row with a Title or Description.

## Browser Console

For more detailed debugging information, open your browser's developer tools (F12 or right-click > Inspect) and check the Console tab. The test page logs detailed information about the loading and parsing process.

## Note

This test page is for development and troubleshooting purposes only. It's recommended to remove or restrict access to it on your production website. 