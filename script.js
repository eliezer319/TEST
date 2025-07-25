// Acceso a la cámara
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const snapBtn = document.getElementById('snap');
const resultDiv = document.getElementById('result');
const ocrStatus = document.getElementById('ocrStatus');

// Activar cámara
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { video.srcObject = stream; })
  .catch(err => { alert("No se pudo acceder a la cámara: " + err); });

snapBtn.onclick = () => {
  // Tomar foto
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  canvas.style.display = 'block';
  ocrStatus.innerText = 'Reconociendo...';
  Tesseract.recognize(canvas, 'eng', { logger: m => {
    ocrStatus.innerText = 'Reconociendo... ' + Math.round((m.progress||0)*100) + '%';
  }}).then(({ data: { text } }) => {
    ocrStatus.innerText = '';
    evaluarRespuestas(text);
  });
};

function evaluarRespuestas(text) {
  let puntaje = 0, total = 0;
  let res = '<b>Resultados:</b><br>';

  // Procesar texto OCR: simplificar espacios, mayúsculas, etc.
  const clean = l => l.replace(/[^A-Za-z]/g, '').toUpperCase();

  // I. TRUE/FALSE
  res += '<u>I. TRUE/FALSE</u><br>';
  let tf = [];
  for(let i=1; i<=5; i++) {
    let found = (text.match(new RegExp(i+'\\.\\s*([TFtf])'))||[])[1];
    tf.push(found ? found.toUpperCase() : '?');
    if (tf[i-1] === ANSWERS.trueFalse[i-1]) puntaje += PTS.trueFalse/5;
    res += `#${i}: ${tf[i-1]||'?'} ${tf[i-1]===ANSWERS.trueFalse[i-1]?'✅':'❌'}<br>`;
  }
  total += PTS.trueFalse;

  // II. MULTIPLE CHOICE
  res += '<u>II. MULTIPLE CHOICE</u><br>';
  let mult = [];
  for(let i=1; i<=3; i++) {
    let found = (text.match(new RegExp('\\('+i+'\\).*?([ABCDabcd])'))||[])[1];
    mult.push(found ? found.toUpperCase() : '?');
    if (mult[i-1] === ANSWERS.multiple[i-1]) puntaje += PTS.multiple/3;
    res += `#${i}: ${mult[i-1]||'?'} ${mult[i-1]===ANSWERS.multiple[i-1]?'✅':'❌'}<br>`;
  }
  total += PTS.multiple;

  // III. MATCHING
  res += '<u>III. MATCHING</u><br>';
  let match = [];
  for(let i=1; i<=5; i++) {
    let found = (text.match(new RegExp('^'+i+'\\.\\s*([ABCDEabcde])', 'mi'))||[])[1];
    match.push(found ? found.toUpperCase() : '?');
    if (match[i-1] === ANSWERS.matching[i-1]) puntaje += PTS.matching/5;
    res += `#${i}: ${match[i-1]||'?'} ${match[i-1]===ANSWERS.matching[i-1]?'✅':'❌'}<br>`;
  }
  total += PTS.matching;

  // IV y V (opcional: requiere OCR más preciso para frases)
  // Aquí podrías comparar palabras/frases simples si los alumnos escriben muy claro.
  // Por simplicidad, puedes dejarlo para la siguiente versión si es necesario.

  // Nota final
  const nota = Math.round((puntaje/total)*10 * 100) / 100;
  res += `<br><b>Puntaje:</b> ${puntaje.toFixed(2)} / ${total}<br><b>Nota:</b> ${nota}`;
  resultDiv.innerHTML = res;
}