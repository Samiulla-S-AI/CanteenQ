
# CanteenQ Project Report Content

## PAGE 1: TITLE PAGE
# CANTEENQ: SMART CANTEEN MANAGEMENT SYSTEM
### A PROJECT REPORT
Submitted in partial fulfillment of the requirements for the degree of
### BACHELOR OF COMPUTER APPLICATIONS / COMPUTER SCIENCE
BY:
**[YOUR NAME]**
Register Number: [YOUR REGISTER NUMBER]

**Under the Guidance of:**
**[SUPERVISOR NAME]**
Assistant Professor, Department of CS

**[COLLEGE NAME AND LOGO]**
[ACADEMIC YEAR 2024-25]

---

## PAGE 2: CERTIFICATE
### CERTIFICATE
This is to certify that the project entitled **"CanteenQ: Smart Canteen Management System"** is a bonafide work carried out by **[YOUR NAME]** in partial fulfillment of the requirements for the award of degree of Bachelor of Computer Science.

The results embodied in this report have not been submitted to any other University or Institute for the award of any degree or diploma.

**Internal Examiner** | **External Examiner** | **Head of Department**

---

## PAGE 3: ABSTRACT
### ABSTRACT
Modern educational and corporate environments require efficient solutions for daily operations, among which canteen management is paramount. Traditional manual systems suffer from long queues, payment discrepancies, and inefficient order tracking. 

**CanteenQ** is a state-of-the-art Smart Canteen Management System designed to bridge the gap between canteen operators and customers. Built using a serverless architecture, it integrates high-end technologies including **React** for a responsive frontend, **Supabase** for real-time relational database management, and **Razorpay** for seamless UPI payment processing. 

The system features a robust administrative dashboard for canteen owners to manage menus, track real-time orders, and analyze financial metrics. On the customer side, it provides a Progressive Web App (PWA) experience, allowing users to browse menus, add items to a persistent cart, and make secure payments. The integration of QR-coded receipts ensures a contactless and verifiable pickup process. 

This project demonstrates the practical application of Database Management Systems (DBMS) in solving real-world logistics and transaction problems, ensuring data integrity through advanced relational schemas and providing actionable business intelligence through automated metrics.

---

## PAGE 4: INTRODUCTION
### 1. INTRODUCTION
In the digital age, automation has become a necessity rather than a luxury. CanteenQ addresses the common bottlenecks found in high-traffic cafeterias.

#### 1.1 BACKGROUND
Canteens are the heart of any institution. However, peak hours often lead to chaotic crowds, manual error in calculations, and delayed service. Digitalizing this process not only saves time but also provides a transparent platform for both users and providers.

#### 1.2 PROBLEM STATEMENT
Existing manual systems or basic standalone applications lack:
- Real-time updates on availability.
- Secure and integrated payment gateways.
- Scalable database architecture to handle multiple canteens.
- Insightful analytics for business growth.

#### 1.3 OBJECTIVES
- To develop a user-friendly web interface for ordering food.
- To implement a secure UPI-based payment system.
- To provide a real-time dashboard for canteen administrators.
- To ensure data persistence and security using modern cloud databases.

---

## PAGE 5: LITERATURE SURVEY / EXISTING SYSTEM
### 2. LITERATURE SURVEY
A study of various canteen management solutions reveals a move from offline software to cloud-based SaaS models.

#### 2.1 EXISTING SYSTEM
Many institutions still rely on paper tokens or simple Excel-based logging.
- **Drawbacks:**
 - High wait-times.
 - Risk of token loss or fraud.
 - Difficulty in generating monthly reports.
 - No way to handle refunds or cancellations efficiently.

#### 2.2 PROPOSED SYSTEM (CanteenQ)
The proposed system leverages web technologies to create a "Live" environment.
- **Key Advantages:**
 - **Scalability:** Handles multiple canteens under one umbrella.
 - **Transparency:** Users can see the status of their order (Pending, Ready, Completed).
 - **Integrated Payments:** Direct UPI transfers reduce cash handling overhead.
 - **Automated Metrics:** Daily and monthly revenue tracking without manual entry.

---

## PAGE 6: TECH STACK & ARCHITECTURE
### 3. TECHNICAL SPECIFICATIONS

#### 3.1 FRONTEND: REACT & TAILWIND CSS
The user interface is built using React to provide a fast, single-page application (SPA) experience. Tailwind CSS is used for a modern, responsive design that works perfectly on mobile phones and desktops.

#### 3.2 BACKEND: NETLIFY FUNCTIONS (SERVERLESS)
Instead of a traditional server, CanteenQ uses serverless functions. This ensures high availability and cost-efficiency as resources are consumed only when needed.

#### 3.3 DATABASE: SUPABASE (PostgreSQL)
Supabase provides a powerful PostgreSQL backend with built-in real-time capabilities. This allows the admin dashboard to update instantly when a new order is placed.

#### 3.4 AUTHENTICATION: CLERK
Secure user management and authentication are handled by Clerk, supporting social logins and secure session management.

#### 3.5 PAYMENTS: RAZORPAY
A robust payment gateway integration allows for UPI, Card, and Net-banking transactions with automated payout splits between the platform and canteen owners.

---

## PAGE 7: SYSTEM ANALYSIS
### 4. SYSTEM REQUIREMENTS

#### 4.1 FUNCTIONAL REQUIREMENTS
- **User Authentication:** Registration and Login for students and staff.
- **Menu Management:** Admin can Add, Edit, or Delete food items.
- **Order Processing:** Real-time state transitions from placement to fulfillment.
- **Payment Verification:** Automatic status update upon successful transaction.
- **Feedback System:** Users can rate food and service.

#### 4.2 NON-FUNCTIONAL REQUIREMENTS
- **Performance:** App should load within 2 seconds.
- **Security:** Use of SSL and encrypted database connections.
- **Reliability:** Data must be backed up and immune to concurrent transaction errors.
- **Scalability:** System should handle 500+ concurrent users during peak hours.

#### 4.3 HARDWARE & SOFTWARE SPECIFICATIONS
- **Development Environment:** VS Code, Node.js v20+, Git.
- **Host:** Netlify Cloud.
- **Database Server:** Supabase Cloud.

---

## PAGE 8: DATABASE DESIGN (THE CORE)
### 5. DATABASE DESIGN (DBMS ASPECT)

The database is built on PostgreSQL, utilizing relational constraints and indexes to ensure high performance.

#### 5.1 ENTITY RELATIONSHIP (ER) OVERVIEW
Key entities include Users, Canteens, Admins, Food Items, Orders, and Transactions.

#### 5.2 DATA DICTIONARY (TABLE SCHEMAS)

**Table 1: `users`**
- `id`: UUID (Primary Key)
- `name`: TEXT - User's full name
- `email`: TEXT (Unique) - Login identifier
- `register_number`: TEXT - Institutional ID
- `department`: TEXT - User's department

**Table 2: `canteens`**
- `id`: TEXT (Primary Key) - Unique canteen code (e.g., 'main_canteen')
- `name`: TEXT - Canteen display name
- `is_active`: BOOLEAN - Status of operation

**Table 3: `food_items`**
- `id`: UUID (Primary Key)
- `name`: TEXT - Item name
- `price`: NUMERIC - Cost of the item
- `category`: TEXT (Food/Drink/Snack)
- `canteen_id`: REFERENCES canteens(id)

---

## PAGE 9: DATABASE DESIGN (CONTINUED)

**Table 4: `orders`**
- `id`: UUID (Primary Key)
- `user_email`: TEXT - Linked to user
- `items`: JSONB - Array of items and quantities
- `total_amount`: NUMERIC - Sum total
- `status`: TEXT (Pending/Ready/Completed/Cancelled)
- `order_number`: TEXT (Unique) - For receipt verification

**Table 5: `payment_transactions`**
- `id`: UUID (Primary Key)
- `order_id`: REFERENCES orders(id)
- `transaction_id`: TEXT - Gateway reference
- `canteen_share`: NUMERIC - Payout to canteen
- `platform_fee`: NUMERIC - Platform commission

**Table 6: `canteen_monthly_metrics`**
- `canteen_id`: UUID
- `total_revenue`: NUMERIC - Aggregated monthly income
- `total_orders`: INTEGER - Volume count
- `last_updated`: TIMESTAMP

---

## PAGE 10: CONCLUSION & FUTURE SCOPE
### 6. CONCLUSION
CanteenQ successfully demonstrates how modern web architecture and robust database management can transform traditional canteen operations. By integrating real-time databases with secure payment gateways, the system provides a frictionless experience for both buyers and sellers.

The project highlights the importance of Relational Database Management Systems (RDBMS) in maintaining data consistency across complex multi-step transactions (Order -> Payment -> Verification -> Fulfillment).

### 7. FUTURE SCOPE
- **AI-Based Prediction:** Implementing machine learning models to predict food demand based on historical data.
- **In-App Messaging:** Direct chat between user and canteen for special instructions.
- **IoT Integration:** Smart thermal printers that automatically print receipts when an order is flagged as 'Ready'.
- **Inventory Management:** Automatic deduction of raw materials per order to alert the chef when supplies are low.

---
**[END OF REPORT]**
