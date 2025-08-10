## Previously Implemented

- Book listing with title, author, category, and status  
- Filter by category  
- Search by title or author  
- Issue and return books  
- Show only issued books  

##  New Features Added (User Dashboard & Admin Dashboard)

###  User Dashboard
-  **My Issued Books** section added  
-  Displays **due date** for issued books  
-  **Overdue books** clearly highlighted  
-  Modal popup for detailed book information  
-  Prevent users from returning books issued by others  
-  Efficient data fetching with cleaner refresh logic  

### Admin Dashboard
-  View all books including issued ones  
-  Add / Edit / Delete books with form validation  
-  Admin-only access via role-based login  
-  Auto-refresh every 5 seconds to reflect book status changes  

##  Backend Validations

- Users can issue **maximum 3 books only**  
-  Prevent duplicate issuing of same book by the same user  
-  Return allowed only by the user who issued the book  

##  Login Page (Frontend)

- Role-based login: **Admin** and **User**  
- Redirects to respective **dashboards** after login  


