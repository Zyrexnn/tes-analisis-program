document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('image-input');
    const uploadButton = document.getElementById('upload-button');
    const resultContainer = document.getElementById('description');
    const uploadedImage = document.getElementById('uploaded-image');
    const loadingText = document.getElementById('loading-text');
    const cameraButton = document.getElementById('camera-button');
    const cameraPreview = document.getElementById('camera-preview');
    let stream;

    uploadButton.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', () => {
        const file = imageInput.files ?.[0];
        if (file) {
            uploadedImage.style.display = 'block';
            loadingText.style.display = 'block';
            resultContainer.textContent = '';
            uploadedImage.src = URL.createObjectURL(file);
            readFile(file);
        }
    });

    cameraButton.addEventListener('click', async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Fitur kamera tidak didukung di browser Anda.');
            return;
        }

        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraPreview.srcObject = stream;
            cameraPreview.style.display = 'block';

            const takePicture = () => {
                const canvas = document.createElement('canvas');
                const videoTrack = stream.getVideoTracks()[0];
                const settings = videoTrack.getSettings();
                canvas.width = settings.width;
                canvas.height = settings.height;
                const context = canvas.getContext('2d');
                context.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], 'captured_image.jpg', { type: 'image/jpeg' });
                    uploadedImage.style.display = 'block';
                    loadingText.style.display = 'block';
                    resultContainer.textContent = '';
                    uploadedImage.src = URL.createObjectURL(file);
                    cameraPreview.style.display = 'none';
                    stream.getTracks().forEach(track => track.stop());
                    await readFile(file);
                }, 'image/jpeg');
            };

            const captureButton = document.createElement('button');
            captureButton.textContent = 'Ambil Foto';
            captureButton.classList.add('military-button');
            cameraPreview.insertAdjacentElement('afterend', captureButton);

            captureButton.addEventListener('click', () => {
                takePicture();
                captureButton.remove();
            });

        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Gagal mengakses kamera.');
        }
    });

    async function readFile(file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Image = reader.result.split(',')[1];
            sendImageToAPI(base64Image);
        };
        reader.readAsDataURL(file);
    }

    async function sendImageToAPI(base64Image) {
        try {
            const response = await fetch('/.netlify/functions/identify-alutsista', { // Endpoint Netlify Function
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: base64Image }),
            });

            loadingText.style.display = 'none';

            if (!response.ok) {
                const errorData = await response.json();
                resultContainer.textContent = `Error: ${errorData.message || 'Gagal mengidentifikasi gambar'}`;
                return;
            }

            const data = await response.json();
            resultContainer.textContent = data.description || 'Tidak dapat mengidentifikasi alutsista ini.';
            uploadedImage.style.display = 'block';

        } catch (error) {
            loadingText.style.display = 'none';
            console.error('Error sending image to API:', error);
            resultContainer.textContent = 'Terjadi kesalahan saat menghubungi server.';
        }
    }
});