
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

def generate_report():
    file_path = "CanteenQ_Project_Report.pdf"
    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=28,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#2c3e50'),
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Heading2'],
        fontSize=18,
        spaceAfter=20,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#34495e'),
        fontName='Helvetica-Bold'
    )

    heading_style = ParagraphStyle(
        'HeadingStyle',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        spaceBefore=12,
        textColor=colors.HexColor('#2980b9'),
        fontName='Helvetica-Bold'
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['BodyText'],
        fontSize=12,
        leading=16,
        spaceAfter=10,
        alignment=TA_JUSTIFY,
        fontName='Helvetica'
    )

    content = []

    # PAGE 1: TITLE PAGE
    content.append(Spacer(1, 2*inch))
    content.append(Paragraph("CANTEENQ: SMART CANTEEN MANAGEMENT SYSTEM", title_style))
    content.append(Spacer(1, 0.5*inch))
    content.append(Paragraph("A DBMS PROJECT REPORT", subtitle_style))
    content.append(Spacer(1, 1*inch))
    content.append(Paragraph("Submitted by:", body_style))
    content.append(Paragraph("<b>VIJAY M A</b> (B.Tech IT)", subtitle_style))
    content.append(Paragraph("<b>SAMIULLA S</b> (B.Tech AI & DS)", subtitle_style))
    content.append(Spacer(1, 0.5*inch))
    content.append(Paragraph("<b>HINDUSTHAN INSTITUTE OF TECHNOLOGY</b>", subtitle_style))
    content.append(Spacer(1, 1*inch))
    content.append(Paragraph("Under the Guidance of:", body_style))
    content.append(Paragraph("<b>Department of Computer Science & Engineering</b>", body_style))
    content.append(Spacer(1, 1*inch))
    content.append(Paragraph("ACADEMIC YEAR 2024 - 2025", subtitle_style))
    content.append(PageBreak())

    # PAGE 2: CERTIFICATE
    content.append(Paragraph("CERTIFICATE", subtitle_style))
    content.append(Spacer(1, 0.5*inch))
    cert_text = """This is to certify that the project entitled <b>"CanteenQ: Smart Canteen Management System"</b> 
    is a bonafide work carried out by <b>VIJAY M A</b> and <b>SAMIULLA S</b> in partial fulfillment of the requirements for 
    the award of degree of Bachelor of Technology. <br/><br/>
    The results embodied in this report have not been submitted to any other University or Institute 
    for the award of any degree or diploma."""
    content.append(Paragraph(cert_text, body_style))
    content.append(Spacer(1, 1.5*inch))
    
    # Signature line
    sig_data = [['________________', '________________', '________________'],
                ['Internal Examiner', 'External Examiner', 'Head of Department']]
    sig_table = Table(sig_data, colWidths=[2*inch, 2*inch, 2*inch])
    sig_table.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER'),
                                   ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold')]))
    content.append(sig_table)
    content.append(PageBreak())

    # PAGE 3: ABSTRACT
    content.append(Paragraph("ABSTRACT", heading_style))
    abstract_text = """Modern educational and corporate environments require efficient solutions for daily operations, among which canteen management is paramount. Traditional manual systems suffer from long queues, payment discrepancies, and inefficient order tracking. <br/><br/>
    <b>CanteenQ</b> is a state-of-the-art Smart Canteen Management System designed to bridge the gap between canteen operators and customers. Built using a serverless architecture, it integrates high-end technologies including <b>React</b> for a responsive frontend, <b>Supabase</b> for real-time relational database management, and <b>Razorpay</b> for seamless UPI payment processing. <br/><br/>
    The system features a robust administrative dashboard for canteen owners to manage menus, track real-time orders, and analyze financial metrics. On the customer side, it provides a Progressive Web App (PWA) experience, allowing users to browse menus, add items to a persistent cart, and make secure payments. The integration of QR-coded receipts ensures a contactless and verifiable pickup process. <br/><br/>
    This project demonstrates the practical application of Database Management Systems (DBMS) in solving real-world logistics and transaction problems, ensuring data integrity through advanced relational schemas and providing actionable business intelligence through automated metrics."""
    content.append(Paragraph(abstract_text, body_style))
    content.append(PageBreak())

    # PAGE 4: INTRODUCTION
    content.append(Paragraph("1. INTRODUCTION", heading_style))
    content.append(Paragraph("In the digital age, automation has become a necessity rather than a luxury. CanteenQ addresses the common bottlenecks found in high-traffic cafeterias.", body_style))
    content.append(Paragraph("1.1 BACKGROUND", heading_style))
    content.append(Paragraph("Canteens are the heart of any institution. However, peak hours often lead to chaotic crowds, manual error in calculations, and delayed service. Digitalizing this process not only saves time but also provides a transparent platform for both users and providers.", body_style))
    content.append(Paragraph("1.2 PROBLEM STATEMENT", heading_style))
    content.append(Paragraph("Existing manual systems or basic standalone applications lack real-time updates on availability, secure and integrated payment gateways, and scalable database architecture to handle multiple canteens.", body_style))
    content.append(Paragraph("1.3 OBJECTIVES", heading_style))
    content.append(Paragraph("- To develop a user-friendly web interface for ordering food.", body_style))
    content.append(Paragraph("- To implement a secure UPI-based payment system.", body_style))
    content.append(Paragraph("- To provide a real-time dashboard for canteen administrators.", body_style))
    content.append(Paragraph("- To ensure data persistence and security using modern cloud databases.", body_style))
    content.append(PageBreak())

    # PAGE 5: LITERATURE SURVEY
    content.append(Paragraph("2. LITERATURE SURVEY / EXISTING SYSTEM", heading_style))
    content.append(Paragraph("A study of various canteen management solutions reveals a move from offline software to cloud-based SaaS models.", body_style))
    content.append(Paragraph("2.1 EXISTING SYSTEM", heading_style))
    content.append(Paragraph("Many institutions still rely on paper tokens or simple Excel-based logging. Drawbacks include high wait-times, risk of token loss, and difficulty in generating reports.", body_style))
    content.append(Paragraph("2.2 PROPOSED SYSTEM (CanteenQ)", heading_style))
    content.append(Paragraph("The proposed system leverages web technologies to create a 'Live' environment. Key advantages include scalability, transparency, and automated metrics.", body_style))
    content.append(PageBreak())

    # PAGE 6: TECH STACK
    content.append(Paragraph("3. TECHNICAL SPECIFICATIONS", heading_style))
    content.append(Paragraph("<b>3.1 FRONTEND: REACT & TAILWIND CSS</b><br/>The user interface is built using React to provide a fast, single-page application (SPA) experience.", body_style))
    content.append(Paragraph("<b>3.2 BACKEND: NETLIFY FUNCTIONS (SERVERLESS)</b><br/>Instead of a traditional server, CanteenQ uses serverless functions for high availability.", body_style))
    content.append(Paragraph("<b>3.3 DATABASE: SUPABASE (PostgreSQL)</b><br/>Supabase provides a powerful PostgreSQL backend with built-in real-time capabilities.", body_style))
    content.append(Paragraph("<b>3.4 AUTHENTICATION: CLERK</b><br/>Secure user management is handled by Clerk, supporting social logins.", body_style))
    content.append(Paragraph("<b>3.5 PAYMENTS: RAZORPAY</b><br/>Robust payment gateway integration for UPI and Card transactions.", body_style))
    content.append(PageBreak())

    # PAGE 7: SYSTEM ANALYSIS
    content.append(Paragraph("4. SYSTEM ANALYSIS & REQUIREMENTS", heading_style))
    content.append(Paragraph("<b>4.1 FUNCTIONAL REQUIREMENTS</b>", body_style))
    content.append(Paragraph("- User Authentication: Secure Login for students.<br/>- Menu Management: Admin can update items.<br/>- Order Processing: Real-time status tracking.", body_style))
    content.append(Paragraph("<b>4.2 NON-FUNCTIONAL REQUIREMENTS</b>", body_style))
    content.append(Paragraph("- Performance: Fast load times.<br/>- Security: Encrypted data and secure sessions.<br/>- Scalability: Support for multiple concurrent users.", body_style))
    content.append(Paragraph("<b>4.3 HARDWARE & SOFTWARE SPECS</b>", body_style))
    content.append(Paragraph("- Node.js v20+, VS Code, Git.<br/>- Netlify Cloud & Supabase PostgreSQL.", body_style))
    content.append(PageBreak())

    # PAGE 8: DATABASE DESIGN I
    content.append(Paragraph("5. DATABASE DESIGN (DBMS ASPECT)", heading_style))
    content.append(Paragraph("The database is built on PostgreSQL, utilizing relational constraints and indexes.", body_style))
    content.append(Paragraph("5.1 TABLE SCHEMAS", heading_style))
    
    # Table data
    data1 = [["Table: users", ""],
             ["Attribute", "Description"],
             ["id", "UUID (Primary Key)"],
             ["name", "Full Name"],
             ["email", "Login ID"],
             ["reg_num", "Institutional ID"]]
    t1 = Table(data1, colWidths=[2.5*inch, 3*inch])
    t1.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,1), colors.lightgrey),
                            ('GRID', (0,0), (-1,-1), 1, colors.black)]))
    content.append(t1)
    content.append(Spacer(1, 0.3*inch))
    
    data2 = [["Table: food_items", ""],
             ["Attribute", "Description"],
             ["id", "UUID (Primary Key)"],
             ["name", "Item Name"],
             ["price", "Cost (Numeric)"],
             ["canteen_id", "Foreign Key"]]
    t2 = Table(data2, colWidths=[2.5*inch, 3*inch])
    t2.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,1), colors.lightgrey),
                            ('GRID', (0,0), (-1,-1), 1, colors.black)]))
    content.append(t2)
    content.append(PageBreak())

    # PAGE 9: DATABASE DESIGN II
    content.append(Paragraph("5.2 DATABASE DESIGN (CONTINUED)", heading_style))
    
    data3 = [["Table: orders", ""],
             ["Attribute", "Description"],
             ["id", "UUID (Primary Key)"],
             ["user_email", "Customer Link"],
             ["items", "JSONB Array"],
             ["status", "Current State"]]
    t3 = Table(data3, colWidths=[2.5*inch, 3*inch])
    t3.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,1), colors.lightgrey),
                            ('GRID', (0,0), (-1,-1), 1, colors.black)]))
    content.append(t3)
    content.append(Spacer(1, 0.3*inch))

    data4 = [["Table: transactions", ""],
             ["Attribute", "Description"],
             ["id", "UUID (PK)"],
             ["amount", "Total Value"],
             ["status", "Success/Failure"]]
    t4 = Table(data4, colWidths=[2.5*inch, 3*inch])
    t4.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,1), colors.lightgrey),
                            ('GRID', (0,0), (-1,-1), 1, colors.black)]))
    content.append(t4)
    content.append(PageBreak())

    # PAGE 10: CONCLUSION
    content.append(Paragraph("6. CONCLUSION & FUTURE SCOPE", heading_style))
    content.append(Paragraph("6.1 CONCLUSION", heading_style))
    content.append(Paragraph("CanteenQ successfully demonstrates how modern web architecture and robust database management can transform traditional canteen operations. By integrating real-time databases with secure payment gateways, the system provides a frictionless experience for both buyers and sellers.", body_style))
    content.append(Paragraph("6.2 FUTURE SCOPE", heading_style))
    content.append(Paragraph("- AI-Based Prediction: Demand forecasting.<br/>- IoT Integration: Auto-printing receipts.<br/>- Inventory Management: Stock tracking.", body_style))
    content.append(Spacer(1, 2*inch))
    content.append(Paragraph("--- END OF REPORT ---", subtitle_style))

    # Build PDF
    doc.build(content)
    print(f"Generated: {file_path}")

if __name__ == "__main__":
    generate_report()
