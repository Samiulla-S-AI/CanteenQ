import os
import zipfile
import sqlite3
import threading
import queue
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import cloudinary
import cloudinary.uploader

# Cloudinary unsigned upload configuration
CLOUD_NAME = "dhjgyzebj"
UPLOAD_PRESET = "samiulla__project_backup"

def get_db_connection():
    # Create or connect to the sqlite database in the same directory as this script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(current_dir, 'backup_history.db')
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS backup_status (
            folder_name TEXT PRIMARY KEY,
            latest_increment INTEGER
        )
    ''')
    conn.commit()
    return conn

def get_next_increment(folder_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT latest_increment FROM backup_status WHERE folder_name = ?', (folder_name,))
    row = cursor.fetchone()
    
    if row is None:
        increment = 1
        cursor.execute('INSERT INTO backup_status (folder_name, latest_increment) VALUES (?, ?)', (folder_name, increment))
    else:
        increment = row[0] + 1
        cursor.execute('UPDATE backup_status SET latest_increment = ? WHERE folder_name = ?', (increment, folder_name))
        
    conn.commit()
    conn.close()
    return increment


class BackupApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Cloud Backup Tool")
        self.root.geometry("650x450")
        self.root.configure(padx=20, pady=20)
        
        # UI Styling
        style = ttk.Style()
        style.configure("TButton", font=("Helvetica", 11, "bold"), padding=5)
        style.configure("TLabel", font=("Helvetica", 11))
        
        # Title Label
        self.lbl_title = ttk.Label(self.root, text="Local to Cloudinary Backup", font=("Helvetica", 16, "bold"))
        self.lbl_title.pack(pady=(0, 15))
        
        # Instruction Label
        self.lbl_instruction = ttk.Label(self.root, text="Select a directory to zip and backup to Cloudinary.\n(Any 'node_modules' folders will be automatically excluded)", justify="center")
        self.lbl_instruction.pack(pady=(0, 15))
        
        # Select Button
        self.btn_select = ttk.Button(self.root, text="Select Folder & Start Backup", command=self.start_backup)
        self.btn_select.pack(pady=10)
        
        # Progress Bar
        self.progress = ttk.Progressbar(self.root, orient="horizontal", mode="indeterminate", length=400)
        self.progress.pack(pady=10)
        
        # Logs Text Area
        self.log_text = tk.Text(self.root, height=12, width=70, state='disabled', font=("Consolas", 9), bg="#f5f5f5")
        self.log_text.pack(pady=10, fill=tk.BOTH, expand=True)
        
        # Message Queue for thread-safe logging
        self.log_queue = queue.Queue()
        self.root.after(100, self.process_log_queue)
        
    def log(self, message):
        """Put message in queue to append to the log text widget securely from worker threads."""
        self.log_queue.put(message)
        
    def process_log_queue(self):
        """Process messages in the queue to update the UI."""
        try:
            while True:
                msg = self.log_queue.get_nowait()
                self.log_text.config(state='normal')
                self.log_text.insert(tk.END, msg + "\n")
                self.log_text.see(tk.END)
                self.log_text.config(state='disabled')
        except queue.Empty:
            pass
        self.root.after(100, self.process_log_queue)

    def start_backup(self):
        """Triggers the folder selection and starts the background task."""
        source_directory = filedialog.askdirectory(title="Select Folder to Backup")
        if not source_directory:
            return
            
        # Disable button to prevent concurrent operations
        self.btn_select.config(state="disabled")
        # Start progress bar animation
        self.progress.start(10)
        
        # Clear previous logs
        self.log_text.config(state='normal')
        self.log_text.delete(1.0, tk.END)
        self.log_text.config(state='disabled')
        
        # Start backup logic in separate thread to prevent UI freezing
        threading.Thread(target=self.run_backup_task, args=(source_directory,), daemon=True).start()
        
    def run_backup_task(self, source_directory):
        try:
            folder_name = os.path.basename(os.path.normpath(source_directory))
            self.log(f"[*] Selected folder: {source_directory}")
            self.log("[*] Connecting to database to get version sequence...")
            
            # Step 1: Database Operations
            increment = get_next_increment(folder_name)
            zip_filename = f"{folder_name}_{increment}.zip"
            
            # Step 2: Establish paths
            current_dir = os.path.dirname(os.path.abspath(__file__))
            zip_filepath = os.path.join(current_dir, zip_filename)
            
            self.log(f"[*] Creating target archive: {zip_filename}")
            self.log("[*] Compressing files... (Ignoring all 'node_modules')")
            
            # Step 3: Zip Compression
            file_count = 0
            with zipfile.ZipFile(zip_filepath, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(source_directory):
                    # Aggressively exclude huge/build folders regardless of case
                    ignore_list = ['node_modules', '.git', '.next', 'dist', 'build', '.cache', '__pycache__', 'coverage']
                    to_remove = [d for d in dirs if d.lower() in ignore_list]
                    
                    for d in to_remove:
                        dirs.remove(d)
                        self.log(f"[*] Excluded heavy directory: {os.path.join(root, d)}")
                    
                    for file in files:
                        file_path = os.path.join(root, file)
                        
                        # Prevent the script from trying to zip the zip file it is currently creating!
                        if os.path.abspath(file_path) == os.path.abspath(zip_filepath):
                            continue
                            
                        arcname = os.path.relpath(file_path, start=source_directory)
                        try:
                            zipf.write(file_path, arcname)
                            file_count += 1
                        except Exception as e:
                            self.log(f"[!] Warning: Could not add {file_path}. Reason: {str(e)}")
            
            self.log(f"[*] Compression completed successfully. Files packed: {file_count}")
            
            file_size_mb = os.path.getsize(zip_filepath) / (1024 * 1024)
            self.log(f"[*] Compressed Zip File Size: {file_size_mb:.2f} MB")
            
            # Step 4: Cloudinary Upload
            self.log("[*] Uploading to Cloudinary... Please wait, this might take a while.")
            cloudinary.config(cloud_name=CLOUD_NAME)
            response = cloudinary.uploader.unsigned_upload(
                zip_filepath,
                upload_preset=UPLOAD_PRESET,
                resource_type="raw"
            )
            
            self.log("[*] Upload successful!")
            self.log(f"[*] Download URL: {response.get('secure_url')}")
            
            # Step 5: Cleanup
            if os.path.exists(zip_filepath):
                os.remove(zip_filepath)
                self.log(f"[*] Cleaned up local temporary zip file.")
                
            # Show Success Dialog in Main Thread
            self.root.after(0, lambda: messagebox.showinfo(
                "Success", 
                f"Backup successful!\n\nFile Name: {zip_filename}\nURL: {response.get('secure_url')}"
            ))
            
        except Exception as e:
            self.log(f"[!] ERROR occurred: {str(e)}")
            # Show Error Dialog in Main Thread
            self.root.after(0, lambda: messagebox.showerror("Error", f"An error occurred:\n{str(e)}"))
            
        finally:
            # Re-enable UI elements in Main Thread
            self.root.after(0, lambda: self.btn_select.config(state="normal"))
            self.root.after(0, self.progress.stop)

def main():
    root = tk.Tk()
    app = BackupApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
