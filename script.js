// WASM 초기화 함수
async function initWasm() {
    try {
        // 보안 컨텍스트 확인
        if (!window.isSecureContext) {
            throw new Error('이 기능은 보안 컨텍스트(HTTPS)에서만 사용할 수 있습니다.');
        }

        const go = new Go();
        const result = await fetch('./main.wasm');
        if (!result.ok) {
            throw new Error(`WASM 파일을 로드할 수 없습니다: ${result.status} ${result.statusText}`);
        }
        const buffer = await result.arrayBuffer();
        const obj = await WebAssembly.instantiate(buffer, go.importObject);
        go.run(obj.instance);
        console.log('WASM initialized successfully');
        // WASM 함수 등록 확인
        console.log('pemToHexArray 함수 확인:', !!window.pemToHexArray);
        console.log('hexArrayToPem 함수 확인:', !!window.hexArrayToPem);
        console.log('sha256Go 함수 확인:', !!window.hexStringToSha256Array);
        console.log('inspectPemDetailsGo 함수 확인:', !!window.inspectPemDetailsGo); // 새 Wasm 함수 확인
    } catch (err) {
        console.error('Failed to initialize WASM:', err);
        // 오류 메시지를 화면에 표시
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; background: #ff5555; color: white; padding: 10px; text-align: center;';
        errorMessage.textContent = `WASM 초기화 실패: ${err.message}`;
        document.body.prepend(errorMessage);
    }
}

// HTML 문자열을 안전하게 처리하기 위한 유틸리티 함수
function escapeHtml(unsafe) {
    if (unsafe === null || typeof unsafe === 'undefined') return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', async () => {
    // WASM 초기화
    await initWasm();

    // 탭 전환을 위한 요소들 선택
    const navLinks = document.querySelectorAll('nav a');
    const toolContainers = document.querySelectorAll('.tool-container');

    // 탭 전환 함수
    function switchTab(targetId) {
        // 모든 탭과 컨테이너의 active 클래스 제거
        navLinks.forEach(link => link.classList.remove('active'));
        toolContainers.forEach(container => container.classList.remove('active'));

        // 선택된 탭과 컨테이너에 active 클래스 추가
        const selectedTab = document.querySelector(`nav a[href="#${targetId}"]`);
        const selectedContainer = document.getElementById(targetId);

        if (selectedTab && selectedContainer) {
            selectedTab.classList.add('active');
            selectedContainer.classList.add('active');
        }
    }

    // 각 탭에 클릭 이벤트 리스너 추가
    navLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            switchTab(targetId);
            window.location.hash = targetId;
        });
    });

    // PEM to HEX 변환 버튼 이벤트 리스너
    const convertButton = document.getElementById('convertButton');
    const pemInput = document.getElementById('pemInput');
    const resultDiv = document.getElementById('result');

    convertButton?.addEventListener('click', () => {
        const pemText = pemInput.value;
        if (window.pemToHexArray) {
            try {
                const cArrayResult = window.pemToHexArray(pemText);
                resultDiv.textContent = cArrayResult;
            } catch (err) {
                resultDiv.textContent = `Error: ${err.message}`;
            }
        } else {
            resultDiv.textContent = "WASM 함수가 아직 로드되지 않았습니다.";
        }
    });

    // HEX to PEM 변환 버튼 이벤트 리스너
    const convertToPemButton = document.getElementById('convertToPem');
    const hexInput = document.getElementById('hexInput');
    const pemResultDiv = document.getElementById('pemResult');

    convertToPemButton?.addEventListener('click', () => {
        const hexText = hexInput.value;
        if (window.hexArrayToPem) {
            try {
                // 기본적으로 CERTIFICATE 타입으로 설정하지만, 필요에 따라 다른 타입을 사용할 수 있습니다.
                const pemResult = window.hexArrayToPem(hexText, "CERTIFICATE");
                pemResultDiv.textContent = pemResult;
            } catch (err) {
                pemResultDiv.textContent = `Error: ${err.message}`;
            }
        } else {
            pemResultDiv.textContent = "HEX to PEM WASM 함수가 아직 로드되지 않았습니다.";
        }
    });

    // SHA256 해시 생성 버튼 이벤트 리스너
    const generateSha256Button = document.getElementById('generateSha256');
    const sha256Input = document.getElementById('sha256Input');
    const sha256ResultDiv = document.getElementById('sha256Result');

    generateSha256Button?.addEventListener('click', () => {
        const inputText = sha256Input.value;
        if (window.sha256Go) {
            try {
                const sha256Result = window.hexStringToSha256Array(inputText);
                sha256ResultDiv.textContent = sha256Result;
            } catch (err) {
                sha256ResultDiv.textContent = `Error: ${err.message}`;
            }
        } else {
            sha256ResultDiv.textContent = "SHA256 WASM 함수가 아직 로드되지 않았습니다.";
        }
    });

    // PEM 내용 검사 버튼 이벤트 리스너 (새 기능)
    const inspectPemButton = document.getElementById('inspectPemButton');
    const pemDetailsResultDiv = document.getElementById('pemDetailsResult');
    // pemInput은 PEM to HEX 변환기와 공유

    inspectPemButton?.addEventListener('click', () => {
        const pemText = pemInput.value.trim();
        if (!pemText) {
            pemDetailsResultDiv.innerHTML = '<p style="color: red;">PEM 형식 인증서를 입력하세요.</p>';
            return;
        }

        if (window.inspectPemDetailsGo) {
            try {
                const resultJson = window.inspectPemDetailsGo(pemText); // Go Wasm 함수 호출
                const certDetails = JSON.parse(resultJson); // JSON 결과 파싱

                if (certDetails.error) {
                    pemDetailsResultDiv.innerHTML = `<p style="color: red;">PEM 분석 오류: ${escapeHtml(certDetails.error)}</p>`;
                    return;
                }

                // result*.html 파일과 유사한 형식으로 HTML 생성
                let htmlContent = '<h2>인증서 정보</h2><ul>';
                const keyDisplayNames = {
                    subject: "Subject",
                    issuer: "Issuer",
                    validFrom: "Valid From",
                    validTo: "Valid To",
                    serialNumber: "Serial Number",
                    version: "Version",
                    signatureAlgorithm: "Signature Algorithm",
                    publicKeyAlgorithm: "Public Key Algorithm",
                    publicKey: "Public Key"
                    // extensions는 별도 처리
                };

                for (const key in certDetails) {
                    if (!Object.hasOwnProperty.call(certDetails, key) || key === 'error' || key === 'extensions') {
                        continue;
                    }
                    const displayName = keyDisplayNames[key] || key.charAt(0).toUpperCase() + key.slice(1);
                    const value = certDetails[key];

                    if (key === 'publicKey') {
                        htmlContent += `<li><strong>${escapeHtml(displayName)}:</strong></li><pre>${escapeHtml(value)}</pre>`;
                    } else {
                        htmlContent += `<li><strong>${escapeHtml(displayName)}:</strong> ${escapeHtml(String(value))}</li>`;
                    }
                }
                htmlContent += '</ul>';

                if (certDetails.extensions && certDetails.extensions.length > 0) {
                    htmlContent += '<h2>확장 필드 (Extensions)</h2><ul>';
                    certDetails.extensions.forEach(ext => {
                        htmlContent += `<li><strong>OID:</strong> ${escapeHtml(ext.oid)}<br><strong>Data:</strong> <pre>${escapeHtml(ext.data)}</pre></li>`;
                    });
                    htmlContent += '</ul>';
                }
                pemDetailsResultDiv.innerHTML = htmlContent;

            } catch (err) {
                pemDetailsResultDiv.innerHTML = `<p style="color: red;">Error processing PEM details: ${escapeHtml(err.message)}</p>`;
            }
        } else {
            pemDetailsResultDiv.innerHTML = '<p style="color: red;">PEM 분석 WASM 함수(inspectPemDetailsGo)가 아직 로드되지 않았습니다.</p>';
        }
    });

    // 페이지 로드 시 초기 탭 설정
    const initialTab = window.location.hash ? window.location.hash.substring(1) : 'pemtohex';
    switchTab(initialTab);
});