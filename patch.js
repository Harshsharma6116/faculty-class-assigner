const fs = require('fs');
const path = require('path');
const dir = 'src/components/features';

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk(dir, function(filePath) {
  if (filePath.endsWith('Modal.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Fix form onSubmit
    content = content.replace(/onSubmit={handleSubmit\(onSubmit\)}/g, 'onSubmit={handleSubmit(onSubmit as any)}');
    
    // Fix resolver generics
    content = content.replace(/resolver: zodResolver\((.*?)\),/g, 'resolver: zodResolver($1) as any,');
    
    // Fix missing import in TimeSlotFormModal
    if (filePath.includes('TimeSlotFormModal.tsx') && !content.includes('CreateTimeSlotInput')) {
        content = content.replace(/import \{ createTimeSlotSchema, updateTimeSlotSchema \} from '@\/lib\/validators\/timeslot';/, "import { createTimeSlotSchema, updateTimeSlotSchema, CreateTimeSlotInput } from '@/lib/validators/timeslot';");
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Patched ' + filePath);
  }
});
