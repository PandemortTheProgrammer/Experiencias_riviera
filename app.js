let experiencias = [];
let reservas = [];
let textoBusqueda = "";
let categoriaActual = "todas";
let precioMaximo = "";
let ordenActual = "normal";

const catalogo = document.querySelector("#catalogo");
const buscador = document.querySelector("#buscador");
const filtroCategoria = document.querySelector("#filtroCategoria");
const entradaPrecioMaximo = document.querySelector("#precioMaximo");
const ordenPrecio = document.querySelector("#ordenPrecio");
const listaReservas = document.querySelector("#listaReservas");
const total = document.querySelector("#total");
const personasTotal = document.querySelector("#personasTotal");
const estado = document.querySelector("#estado");
const mensaje = document.querySelector("#mensaje");
const vaciarReservacion = document.querySelector("#vaciarReservacion");

async function cargarExperiencias() {
  try {
    estado.textContent = "Cargando experiencias...";
    const respuesta = await fetch("./data/experiencias.json");
    if (!respuesta.ok) {
      throw new Error("No fue posible cargar las experiencias");
    }
    experiencias = await respuesta.json();
    actualizarCatalogo();
  } catch (error) {
    estado.textContent = "Error al cargar la información";
    console.error(error);
  }
}

function obtenerResultados() {
  let resultados = [...experiencias];
  if (categoriaActual !== "todas") {
    resultados = resultados.filter(
      (experiencia) => experiencia.categoria === categoriaActual,
    );
  }
  if (textoBusqueda !== "") {
    resultados = resultados.filter((experiencia) =>
      experiencia.nombre.toLowerCase().includes(textoBusqueda),
    );
  }
  if (precioMaximo !== "") {
    resultados = resultados.filter(
      (experiencia) => experiencia.precio <= Number(precioMaximo),
    );
  }
  if (ordenActual === "ascendente") {
    resultados.sort((a, b) => a.precio - b.precio);
  }
  if (ordenActual === "descendente") {
    resultados.sort((a, b) => b.precio - a.precio);
  }
  return resultados;
}

function actualizarCatalogo() {
  const resultados = obtenerResultados();
  if (resultados.length === 0) {
    catalogo.innerHTML = '<p class="sin-resultados">No se encontraron experiencias</p>';
    estado.textContent = "0 resultados";
    return;
  }
  catalogo.innerHTML = resultados
    .map(
      (experiencia) => `
      <article class="tarjeta">
        <div class="imagen" aria-hidden="true">${experiencia.icono}</div>
        <div class="informacion">
            <span class="categoria">${experiencia.categoria}</span>
            <h3>${experiencia.nombre}</h3>
            <p>Cupo disponible: ${experiencia.cupo}</p>
            <p class="precio">$${experiencia.precio} MXN</p>
            <label for="cantidad-${experiencia.id}">Personas:</label>
            <input type="number" id="cantidad-${experiencia.id}" min="1" max="${experiencia.cupo}" step="1" value="1">
            <button class="btn-reservar" type="button" data-id="${experiencia.id}">
                Agregar
            </button>
        </div>
      </article>
`,
    )
    .join("");
  estado.textContent = `${resultados.length} experiencias disponibles`;
  agregarEventosReservar();
}

function agregarEventosReservar() {
  const botonesReservar = document.querySelectorAll(".btn-reservar");
  botonesReservar.forEach((boton) => {
    boton.addEventListener("click", () => {
      agregarReserva(Number(boton.dataset.id));
    });
  });
}

function agregarReserva(id) {
  const experiencia = experiencias.find((elemento) => elemento.id === id);
  const entradaCantidad = document.querySelector(`#cantidad-${id}`);
  const cantidad = entradaCantidad.valueAsNumber;
  if (!Number.isInteger(cantidad) || cantidad < 1) {
    mensaje.textContent = "Ingresa una cantidad válida de personas.";
    entradaCantidad.focus();
    return;
  }
  const reservaExistente = reservas.find(
    (reserva) => reserva.experienciaId === id,
  );
  const nuevaCantidad = (reservaExistente?.cantidad ?? 0) + cantidad;
  if (nuevaCantidad > experiencia.cupo) {
    mensaje.textContent = `La cantidad supera el cupo disponible (${experiencia.cupo}).`;
    entradaCantidad.focus();
    return;
  }
  if (reservaExistente) {
    reservaExistente.cantidad = nuevaCantidad;
    reservaExistente.subtotal = nuevaCantidad * experiencia.precio;
  } else {
    reservas.push({
      experienciaId: experiencia.id,
      nombre: experiencia.nombre,
      precio: experiencia.precio,
      cantidad,
      subtotal: experiencia.precio * cantidad,
    });
  }
  mensaje.textContent = "La reservación se actualizó correctamente.";
  mostrarReservas();
}

function mostrarReservas() {
  if (reservas.length === 0) {
    listaReservas.innerHTML = "<p>No hay experiencias seleccionadas.</p>";
  } else {
    listaReservas.innerHTML = reservas
      .map(
        (reserva) => `
      <article class="item-reserva">
        <div>
            <strong>${reserva.nombre}</strong>
            <p>${reserva.cantidad} persona(s) × $${reserva.precio}</p>
            <div class="controles-cantidad" aria-label="Modificar personas para ${reserva.nombre}">
              <button class="btn-cantidad" type="button" data-accion="disminuir" data-id="${reserva.experienciaId}" aria-label="Disminuir personas de ${reserva.nombre}">−</button>
              <button class="btn-cantidad" type="button" data-accion="aumentar" data-id="${reserva.experienciaId}" aria-label="Aumentar personas de ${reserva.nombre}">+</button>
            </div>
        </div>
        <div>
            <strong>$${reserva.subtotal} MXN</strong>
            <button class="btn-eliminar" type="button" data-id="${reserva.experienciaId}">
                Eliminar
            </button>
        </div>
      </article>
`,
      )
      .join("");
  }
  const totalReserva = reservas.reduce(
    (acumulado, reserva) => acumulado + reserva.subtotal,
    0,
  );
  const cantidadPersonas = reservas.reduce(
    (acumulado, reserva) => acumulado + reserva.cantidad,
    0,
  );
  personasTotal.textContent = cantidadPersonas;
  total.textContent = `$${totalReserva} MXN`;
  agregarEventosReservas();
}

function agregarEventosReservas() {
  document.querySelectorAll(".btn-eliminar").forEach((boton) => {
    boton.addEventListener("click", () => {
      eliminarReserva(Number(boton.dataset.id));
    });
  });
  document.querySelectorAll(".btn-cantidad").forEach((boton) => {
    boton.addEventListener("click", () => {
      actualizarCantidadReserva(
        Number(boton.dataset.id),
        boton.dataset.accion === "aumentar" ? 1 : -1,
      );
    });
  });
}

function actualizarCantidadReserva(id, cambio) {
  const reserva = reservas.find((elemento) => elemento.experienciaId === id);
  const experiencia = experiencias.find((elemento) => elemento.id === id);
  const nuevaCantidad = reserva.cantidad + cambio;
  if (nuevaCantidad < 1) {
    mensaje.textContent = "La reservación debe incluir al menos una persona.";
    return;
  }
  if (nuevaCantidad > experiencia.cupo) {
    mensaje.textContent = `No se puede superar el cupo disponible (${experiencia.cupo}).`;
    return;
  }
  reserva.cantidad = nuevaCantidad;
  reserva.subtotal = nuevaCantidad * reserva.precio;
  mensaje.textContent = "La cantidad de personas se actualizó.";
  mostrarReservas();
}

function eliminarReserva(id) {
  reservas = reservas.filter((reserva) => reserva.experienciaId !== id);
  mensaje.textContent = "La experiencia se eliminó de la reservación.";
  mostrarReservas();
}

buscador.addEventListener("input", () => {
  textoBusqueda = buscador.value.trim().toLowerCase();
  actualizarCatalogo();
});

filtroCategoria.addEventListener("change", () => {
  categoriaActual = filtroCategoria.value;
  actualizarCatalogo();
});

entradaPrecioMaximo.addEventListener("input", () => {
  if (entradaPrecioMaximo.value !== "" && Number(entradaPrecioMaximo.value) < 0) {
    mensaje.textContent = "El precio máximo no puede ser negativo.";
    return;
  }
  precioMaximo = entradaPrecioMaximo.value;
  actualizarCatalogo();
});

ordenPrecio.addEventListener("change", () => {
  ordenActual = ordenPrecio.value;
  actualizarCatalogo();
});

vaciarReservacion.addEventListener("click", () => {
  if (reservas.length === 0) {
    mensaje.textContent = "No hay reservaciones para vaciar.";
    return;
  }
  if (window.confirm("¿Deseas borrar toda la reservación?")) {
    reservas = [];
    mensaje.textContent = "La reservación se vació correctamente.";
    mostrarReservas();
  }
});

cargarExperiencias();
