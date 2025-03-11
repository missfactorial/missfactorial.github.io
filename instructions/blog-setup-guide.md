# Blog System Setup Guide

## Overview
This guide will help you set up the blog system that reads data from an Excel (XLSX) file and displays it on your website with pagination.

## Step 1: Excel File Setup
1. Ensure your `news.xlsx` file is in the `blog` folder of your website.
2. Make sure the Excel file has the following column headers in the first row:
   - `Blog #` - A unique identifier for each blog post (optional)
   - `Type` - The type of event or activity (e.g., "Outreach talk", "Volunteer")
   - `Title` - The title of your blog post
   - `Organization/Event` - The organization or event name
   - `Date` - The date of the post (format: YYYY-MM-DD or Month DD, YYYY)
   - `City` - The city where the event took place
   - `Location` - The specific location of the event
   - `Description` - The main content of your blog post
   - `Images` - Comma-separated list of image URLs (optional)
3. Fill in your blog posts in the rows below the header row.
4. Save the file in Excel format (.xlsx) - this format handles text with commas, quotes, and special characters much better than CSV.

> **Note:** Using Excel format (.xlsx) instead of CSV solves many formatting issues, especially with text that contains commas, quotes, or multiple lines.

## Step 2: Adding New Blog Posts
1. To add a new blog post, simply add a new row to the `news.xlsx` file.
2. Fill in the relevant columns for your new post.
3. Save the file and upload it to your website.
4. The blog system will automatically display the new post, sorted by date (newest first).

## GitHub Pages Deployment
When deploying to GitHub Pages, follow these additional steps to ensure your Excel file is properly loaded:

1. Make sure the `news.xlsx` file is committed to your repository in the `blog` folder.
2. Verify that the file is in the correct directory structure.
3. After deploying to GitHub Pages, if you encounter loading issues, check the browser console for error messages.

> **Note:** The system uses the SheetJS library to parse Excel files directly in the browser. This library is loaded automatically when needed.

> **Important:** If you move your website to a different hosting provider or change your GitHub Pages configuration, you may need to revisit how the Excel file is loaded. The current implementation assumes the file is accessible at the path `blog/news.xlsx` relative to the root of your website.

## Excel Format Example
Your Excel file should look like this:

| Blog # | Type | Title | Organization/Event | Date | City | Location | Description | Images |
|--------|------|-------|-------------------|------|------|----------|-------------|--------|
| 0050 | Lead Instructor | DS4A Career Accelerator program | Correlation One | May 8, 2024 | | Virtual | We recently completed a training engagement for the DS4A Career Accelerator program... | |
| 0049 | Volunteer | Accessibility Hackathon | Code Your Dreams | March 9, 2024 | Chicago, IL | Google HQ | Viviana recently participated as volunteer in the 'Hack for Accessibility' event... | |

## Troubleshooting
- **No posts appear:** Check your browser console for errors. Make sure your Excel file is properly formatted and accessible.
- **Excel parsing errors:** Ensure that your Excel file is saved in .xlsx format (not .xls or .csv).
- **Images don't load:** Ensure the image URLs are publicly accessible and correctly formatted in the Excel file.
- **GitHub Pages issues:** Check the browser console for specific error messages that can help identify if the issue is with the file path or the file content.

## Customization
- You can customize the appearance of your blog posts by editing the CSS in `assets/css/blog-pagination.css`.
- To change the number of posts per page, modify the `POSTS_PER_PAGE` constant in `assets/js/blog-loader.js` (currently set to 5 posts per page). 