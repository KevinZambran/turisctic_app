function validarFormulario() {
    var name = document.getElementById("nombre").value;
    var email = document.getElementById("correo").value;
    var cel = document.getElementById("celular").value;
    var msg = document.getElementById("mensaje").value;

    // Validar que todos los campos estén completos
    if (name === "" || email === "" || cel === "" || msg === "") {
        alert("Existen campos vacios, llenalos");
        return false;
    }

    // Validar formato de correo electrónico
    var expresionemail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!expresionemail.test(email)) {
        alert("El email no es válido, corríjalo");
        return false;
    }

    // Validar que el número de celular sea válido
    var expresioncel = /^\d{10}$/;
    if (!expresioncel.test(cel)) {
        alert("El numero de celular debe contener solo 10 digitos!");
        return false;
    }

    // Validación exitosa
    alert("Gracias por escribirnos tu opinión, sigue disfrutando de nuestro servicio :)");
    return true;
}
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
