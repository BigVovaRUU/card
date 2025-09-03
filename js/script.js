document.getElementById('expiry').addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9\/]/g, '').replace(/(\d{2})(\d{2})/, '$1/$2');
});

document.getElementById('cvv').addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '').slice(0, 3);
});