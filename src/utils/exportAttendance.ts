import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface AttendanceRecord {
  student_id: string;
  status: string;
  notes?: string;
  student?: {
    profile?: {
      full_name?: string;
      email?: string;
    };
  };
}

interface ExportData {
  lessonTitle: string;
  lessonDate: string;
  records: AttendanceRecord[];
}

export function exportAttendanceToExcel(data: ExportData) {
  const { lessonTitle, lessonDate, records } = data;
  
  // Create CSV content
  const headers = ['الطالب', 'البريد الإلكتروني', 'الحالة', 'ملاحظات'];
  const rows = records.map(r => [
    r.student?.profile?.full_name || 'غير معروف',
    r.student?.profile?.email || '-',
    r.status === 'present' ? 'حاضر' : r.status === 'absent' ? 'غائب' : 'متأخر',
    r.notes || '-',
  ]);

  // Add BOM for Arabic support in Excel
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    `سجل حضور: ${lessonTitle}`,
    `التاريخ: ${lessonDate}`,
    '',
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `attendance_${lessonTitle}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
}

export function exportAttendanceToPDF(data: ExportData) {
  const { lessonTitle, lessonDate, records } = data;
  
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text('Attendance Record', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Lesson: ${lessonTitle}`, 20, 35);
  doc.text(`Date: ${lessonDate}`, 20, 45);
  
  // Stats
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  
  doc.text(`Present: ${present} | Absent: ${absent} | Late: ${late}`, 20, 55);
  
  // Table headers
  doc.setFillColor(240, 240, 240);
  doc.rect(20, 65, 170, 10, 'F');
  doc.setFontSize(10);
  doc.text('Student', 25, 72);
  doc.text('Email', 70, 72);
  doc.text('Status', 130, 72);
  doc.text('Notes', 155, 72);
  
  // Table rows
  let y = 82;
  records.forEach((record, index) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    const status = record.status === 'present' ? 'Present' 
      : record.status === 'absent' ? 'Absent' : 'Late';
    
    doc.text(record.student?.profile?.full_name || 'Unknown', 25, y);
    doc.text(record.student?.profile?.email || '-', 70, y);
    doc.text(status, 130, y);
    doc.text((record.notes || '-').substring(0, 20), 155, y);
    
    y += 10;
  });
  
  // Download
  doc.save(`attendance_${lessonTitle}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}
