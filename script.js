document.addEventListener('DOMContentLoaded', () => {
    // State
    let students = [];
    let selectedStudents = new Set();
    let logoSrc = null;
    let csvFile = null;
    let lastSelectedIndex = null;

    // Element References
    const mainApp = document.getElementById('main-app');
    const printPreviewContainer = document.getElementById('print-preview-container');
    const printPreviewContent = document.getElementById('print-preview-content');
    
    const fileUploadContainer = document.getElementById('file-upload-container');
    const fileInput = document.getElementById('file-input');
    const fileUploadStatus = document.getElementById('file-upload-status');
    const csvFileName = document.getElementById('csv-file-name');
    const removeCsvBtn = document.getElementById('remove-csv-btn');
    
    const logoUpload = document.getElementById('logo-upload');
    const logoPreviewContainer = document.getElementById('logo-preview-container');
    const logoUploadControl = document.getElementById('logo-upload-control');
    const logoRemoveControl = document.getElementById('logo-remove-control');
    const removeLogoBtn = document.getElementById('remove-logo-btn');
    
    const studentListUl = document.getElementById('student-list-ul');
    const studentListPlaceholder = document.getElementById('student-list-placeholder');
    const searchInput = document.getElementById('search-input');
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const selectionCount = document.getElementById('selection-count');
    
    const generateBtn = document.getElementById('generate-btn');
    const generateBtnText = document.getElementById('generate-btn-text');
    const backToMainBtn = document.getElementById('back-to-main-btn');
    const printBtn = document.getElementById('print-btn');
    
    const academicYearSelect = document.getElementById('academic-year-select');
    const gradeSelect = document.getElementById('grade-select');
    
    const errorContainer = document.getElementById('error-message-container');
    const errorMessage = document.getElementById('error-message');
    
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // --- UI Update Functions ---
    const updateStudentList = () => {
        studentListUl.innerHTML = '';
        const query = searchInput.value.toLowerCase();
        
        const filteredStudents = students.filter(s => 
            (s['이름']?.toLowerCase() || '').includes(query) || 
            (s['학번'] || '').includes(query)
        );

        if (students.length === 0) {
            studentListPlaceholder.textContent = 'CSV 파일을 업로드하면 학생 목록이 표시됩니다.';
            studentListPlaceholder.classList.remove('hidden');
        } else if (filteredStudents.length === 0) {
            studentListPlaceholder.textContent = '검색된 학생이 없습니다.';
            studentListPlaceholder.classList.remove('hidden');
        } else {
            studentListPlaceholder.classList.add('hidden');
            filteredStudents.forEach((student, index) => {
                const li = document.createElement('li');
                li.className = `p-3 text-sm text-gray-800 cursor-pointer select-none transition-colors duration-100 ${selectedStudents.has(student['학번']) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`;
                li.textContent = `${student['학번']} ${student['이름']}`;
                li.dataset.id = student['학번'];
                li.dataset.originalIndex = students.findIndex(s => s['학번'] === student['학번']);
                li.addEventListener('click', (e) => handleStudentClick(e, li));
                studentListUl.appendChild(li);
            });
        }
        updateSelectionCount();
        updateSelectAllCheckbox();
    };
    
    const updateSelectionCount = () => {
        selectionCount.textContent = `${selectedStudents.size} / ${students.length} 선택됨`;
        if (selectedStudents.size > 0) {
            generateBtn.disabled = false;
            generateBtnText.textContent = `${selectedStudents.size}명의 확인서 인쇄하기`;
        } else {
            generateBtn.disabled = true;
            generateBtnText.textContent = '학생을 선택하세요';
        }
    };

    const updateSelectAllCheckbox = () => {
        const filteredIds = Array.from(studentListUl.children).map(li => li.dataset.id);
        if (filteredIds.length === 0) {
            selectAllCheckbox.checked = false;
            selectAllCheckbox.disabled = true;
            return;
        }
        selectAllCheckbox.disabled = false;
        selectAllCheckbox.checked = filteredIds.every(id => selectedStudents.has(id));
    };

    const showError = (message) => {
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
    };

    const hideError = () => {
        errorContainer.classList.add('hidden');
    };

    // --- Event Handlers ---
    fileUploadContainer.addEventListener('click', () => fileInput.click());
    fileUploadContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUploadContainer.classList.add('border-blue-500', 'bg-blue-50');
    });
    fileUploadContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        fileUploadContainer.classList.remove('border-blue-500', 'bg-blue-50');
    });
    fileUploadContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUploadContainer.classList.remove('border-blue-500', 'bg-blue-50');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });
    
    removeCsvBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        csvFile = null;
        students = [];
        selectedStudents.clear();
        fileInput.value = '';
        fileUploadStatus.classList.add('hidden');
        updateStudentList();
    });

    logoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.size < 1024 * 1024) { // 1MB limit
            const reader = new FileReader();
            reader.onloadend = () => {
                logoSrc = reader.result;
                logoPreviewContainer.innerHTML = `<img src="${logoSrc}" class="h-full w-full object-contain" alt="School logo preview">`;
                logoUploadControl.classList.add('hidden');
                logoRemoveControl.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert('파일 크기가 1MB를 초과합니다.');
        }
    });

    removeLogoBtn.addEventListener('click', () => {
        logoSrc = null;
        logoUpload.value = '';
        logoPreviewContainer.innerHTML = `<svg class="h-20 w-20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-label="Default School Logo" role="img"><g><path d="M50 5 L10 20 V60 C10 85, 50 95, 50 95 C50 95, 90 85, 90 60 V20 L50 5 Z" fill="#F0F4F8" stroke="#4A5568" stroke-width="3"></path><path d="M35 65 C 50 50, 65 50, 65 65 L 65 35 C 50 45, 35 45, 35 35 Z M 50 42 V 68" fill="none" stroke="#2D3748" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`;
        logoUploadControl.classList.remove('hidden');
        logoRemoveControl.classList.add('hidden');
    });

    searchInput.addEventListener('input', updateStudentList);

    selectAllCheckbox.addEventListener('change', (e) => {
        const filteredIds = Array.from(studentListUl.children).map(li => li.dataset.id);
        if (e.target.checked) {
            filteredIds.forEach(id => selectedStudents.add(id));
        } else {
            filteredIds.forEach(id => selectedStudents.delete(id));
        }
        updateStudentList();
    });
    
    function handleStudentClick(e, li) {
        const clickedId = li.dataset.id;
        const clickedIndex = parseInt(li.dataset.originalIndex, 10);

        if (e.shiftKey && lastSelectedIndex !== null) {
            const start = Math.min(lastSelectedIndex, clickedIndex);
            const end = Math.max(lastSelectedIndex, clickedIndex);
            const newSelection = new Set();
            for (let i = start; i <= end; i++) {
                newSelection.add(students[i]['학번']);
            }
            selectedStudents = newSelection;
        } else if (e.ctrlKey || e.metaKey) {
            if (selectedStudents.has(clickedId)) {
                selectedStudents.delete(clickedId);
            } else {
                selectedStudents.add(clickedId);
            }
            lastSelectedIndex = clickedIndex;
        } else {
            selectedStudents.clear();
            selectedStudents.add(clickedId);
            lastSelectedIndex = clickedIndex;
        }
        updateStudentList();
    }
    
    generateBtn.addEventListener('click', () => {
        if (selectedStudents.size > 0) {
            generatePrintPreview();
            mainApp.classList.add('hidden');
            printPreviewContainer.classList.remove('hidden');
        }
    });

    backToMainBtn.addEventListener('click', () => {
        mainApp.classList.remove('hidden');
        printPreviewContainer.classList.add('hidden');
        printPreviewContent.innerHTML = '';
    });

    printBtn.addEventListener('click', () => {
        window.print();
    });

    // --- Core Logic ---
    const handleFile = (file) => {
        if (file.name.split('.').pop()?.toLowerCase() !== 'csv') {
            alert('CSV 파일만 업로드할 수 있습니다.');
            return;
        }
        csvFile = file;
        csvFileName.textContent = file.name;
        fileUploadStatus.classList.remove('hidden');
        parseCsv(file);
    };

    const parseCsv = (file) => {
        studentListPlaceholder.textContent = 'CSV 파일을 파싱 중입니다...';
        hideError();

        const parsePromise = (config) => new Promise(resolve => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                ...config,
                complete: resolve,
                error: (err) => resolve({ papaparse_error: true, error: err }),
            });
        });
        
        const cleanBomData = (results) => {
            if (!results.data || !results.data.length || !results.meta.fields.length) return results;
            const firstHeader = results.meta.fields[0];
            if (firstHeader && firstHeader.startsWith('﻿')) {
                const newFields = results.meta.fields.map((field, index) => index === 0 ? field.replace(/^﻿/, '') : field);
                const newData = results.data.map((row) => {
                    const newRow = {};
                    for (const oldKey in row) {
                        newRow[oldKey.replace(/^﻿/, '')] = row[oldKey];
                    }
                    return newRow;
                });
                return { ...results, data: newData, meta: { ...results.meta, fields: newFields } };
            }
            return results;
        };

        const hasRequiredColumns = (results) => {
            if (!results?.meta?.fields) return false;
            return ['학번', '이름'].every(col => results.meta.fields.includes(col));
        };

        parsePromise({}).then(resultsUTF8 => {
            let finalResults = cleanBomData(resultsUTF8);

            if (finalResults.papaparse_error || !hasRequiredColumns(finalResults)) {
                console.warn("UTF-8 파싱 실패 또는 필수 열 누락. EUC-KR로 재시도합니다.");
                return parsePromise({ encoding: 'EUC-KR' }).then(cleanBomData);
            }
            return finalResults;
        }).then(finalResults => {
            if (finalResults.papaparse_error || !hasRequiredColumns(finalResults)) {
                throw new Error("CSV 파싱에 실패했습니다. 파일이 UTF-8 또는 EUC-KR로 인코딩되었는지, '학번'과 '이름' 열이 있는지 확인하세요.");
            }
            
            students = finalResults.data.filter(s => s['학번'] && s['이름']);
            if (students.length === 0) {
                throw new Error("파일에서 유효한 학생 데이터를 찾을 수 없습니다.");
            }
            
            selectedStudents.clear();
            updateStudentList();
        }).catch(err => {
            students = [];
            selectedStudents.clear();
            updateStudentList();
            showError(err.message);
        });
    };
    
    const generateConfirmationHTML = (student) => {
        const studentId = student['학번'];
        const studentName = student['이름'];
        const academicYear = academicYearSelect.value;
        const grade = gradeSelect.value;
        
        const allPossibleSubjects = Object.keys(student).filter(h => h && h.trim() !== '' && !['학번', '이름'].includes(h.trim()));
        const totalSubjects = allPossibleSubjects.length;

        let containerPadding, headerTextSize, studentInfoTextSize, tableTextSize, cellPadding, checkmarkTextSize, logoHeight, footerMargin;

        if (totalSubjects <= 22) {
            containerPadding = 'p-8 sm:p-12'; headerTextSize = 'text-3xl sm:text-4xl'; studentInfoTextSize = 'text-xl sm:text-2xl'; tableTextSize = 'text-base'; cellPadding = 'py-3 px-2'; checkmarkTextSize = 'text-lg'; logoHeight = 'h-8'; footerMargin = 'mt-12';
        } else if (totalSubjects <= 30) {
            containerPadding = 'p-6 sm:p-8'; headerTextSize = 'text-2xl sm:text-3xl'; studentInfoTextSize = 'text-lg sm:text-xl'; tableTextSize = 'text-sm'; cellPadding = 'py-1.5 px-2'; checkmarkTextSize = 'text-base'; logoHeight = 'h-7'; footerMargin = 'mt-6';
        } else {
            containerPadding = 'p-4 sm:p-6'; headerTextSize = 'text-2xl sm:text-3xl'; studentInfoTextSize = 'text-lg sm:text-xl'; tableTextSize = 'text-xs'; cellPadding = 'py-1 px-2'; checkmarkTextSize = 'text-sm'; logoHeight = 'h-6'; footerMargin = 'mt-4';
        }

        const subjectsHTML = allPossibleSubjects.map((subject, index) => `
            <tr class="${index % 2 !== 0 ? 'bg-gray-50' : ''}">
                <td class="${cellPadding} text-center text-gray-800">${subject}</td>
                <td class="${cellPadding} text-center text-gray-800 font-semibold ${checkmarkTextSize}">${student[subject] === '1' ? '✔' : ''}</td>
                <td class="${cellPadding}"></td>
            </tr>
        `).join('');

        const logoHTML = logoSrc 
            ? `<img src="${logoSrc}" alt="School Logo" class="${logoHeight} w-auto object-contain" />`
            : `<svg class="${logoHeight} w-auto" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><g><path d="M50 5 L10 20 V60 C10 85, 50 95, 50 95 C50 95, 90 85, 90 60 V20 L50 5 Z" fill="#F0F4F8" stroke="#4A5568" stroke-width="3"></path><path d="M35 65 C 50 50, 65 50, 65 65 L 65 35 C 50 45, 35 45, 35 35 Z M 50 42 V 68" fill="none" stroke="#2D3748" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>`;

        return `
            <div class="confirmation-page mx-auto my-4 max-w-4xl bg-white ${containerPadding} border-2 border-gray-200 rounded-lg shadow-md font-[sans-serif]">
                <header class="text-center mb-12">
                    <h1 class="${headerTextSize} font-bold text-gray-800">${academicYear}학년도 ${grade} 교과서 신청 확인서</h1>
                </header>
                <div class="text-right mb-10">
                    <p class="${studentInfoTextSize} font-bold text-blue-800">${studentId} ${studentName}</p>
                </div>
                <div class="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                    <table class="w-full ${tableTextSize} table-fixed">
                        <thead class="bg-blue-100">
                            <tr>
                                <th class="${cellPadding} w-1/2 text-center font-semibold text-gray-700 tracking-wider">선택과목</th>
                                <th class="${cellPadding} w-40 text-center font-semibold text-gray-700 tracking-wider">신청</th>
                                <th class="${cellPadding} text-center font-semibold text-gray-700 tracking-wider">비고</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200 bg-white">${subjectsHTML}</tbody>
                    </table>
                </div>
                <footer class="${footerMargin} flex justify-end items-center">
                    <div class="text-right leading-tight flex flex-col items-center">${logoHTML}</div>
                </footer>
            </div>`;
    };

    const generatePrintPreview = () => {
        printPreviewContent.innerHTML = '';
        const studentsToPrint = students.filter(s => selectedStudents.has(s['학번']));
        studentsToPrint.forEach(student => {
            const confirmationHTML = generateConfirmationHTML(student);
            printPreviewContent.innerHTML += confirmationHTML;
        });
    };

});