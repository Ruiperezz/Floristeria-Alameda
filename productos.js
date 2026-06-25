var PRODUCTOS = [
  { id:'p01', img:'imgs/p01.jpg', categoria:'rosas', nombre:'12 Rosas Rosa', emoji:'🌸', precio:95,
    descripcion:'Docena de rosas en el más delicado tono rosa, con paniculata blanca, helecho y margaritas. Presentadas en elegante tul rosa con lazo de arpillera. El regalo romántico por excelencia para cumpleaños, aniversarios o cualquier declaración especial.' },

  { id:'p02', img:'imgs/p02.jpg', categoria:'rosas', nombre:'12 Rosas Blancas', emoji:'🤍', precio:95,
    descripcion:'Doce rosas blancas de primera calidad acompañadas de paniculata cobre, eucalipto y helecho. Presentación en arpillera rústica con lazo de encaje artesanal. Sinónimo de pureza, admiración y elegancia atemporal para las ocasiones más significativas.' },

  { id:'p03', img:'imgs/p03.jpg', categoria:'rosas', nombre:'12 Rosas Amarillas', emoji:'💛', precio:95,
    descripcion:'Docena de luminosas rosas amarillas con hypericum rosa, paniculata y helecho, presentadas en arpillera con lazo de red rosa. El color de la alegría, la amistad y la energía positiva. Un regalo que ilumina cualquier espacio y saca una sonrisa garantizada.' },

  { id:'p04', img:'imgs/p04.jpg', categoria:'rosas', nombre:'12 Rosas Rojas', emoji:'🌹', precio:95,
    descripcion:'La declaración de amor más clásica y apasionada: doce rosas rojas de tallo largo con paniculata blanca y eucalipto, en presentación premium de papel rosa con lazo granate. Ideal para San Valentín, aniversarios o cualquier ocasión especial.' },

  { id:'p05', img:'imgs/p05.jpg', categoria:'rosas', nombre:'6 Rosas Rosa', emoji:'🌸', precio:55,
    descripcion:'Seis rosas rosa en plena madurez, con eucalipto y paniculata blanca, presentadas en arpillera artesanal con lazo de red rosa. Una opción más íntima y personal para sorprender con un detalle cargado de ternura y cariño sincero.' },

  { id:'p06', img:'imgs/p06.jpg', categoria:'rosas', nombre:'6 Rosas Azules Pintadas', emoji:'💙', precio:75,
    descripcion:'Seis rosas pintadas a mano en hipnótico azul intenso, con paniculata azul y helecho, presentadas en envoltorio de tul blanco con lazo de rafia. Una pieza única e irrepetible para quienes buscan un regalo verdaderamente diferente y extraordinario.' },

  { id:'p07', img:'imgs/p07.jpg', categoria:'rosas', nombre:'6 Rosas Rojas', emoji:'🌹', precio:55,
    descripcion:'Seis rosas rojas de tallo largo con hypericum, eucalipto y paniculata, presentadas en arpillera con lazo de red roja. El regalo clásico y apasionado para una ocasión íntima y romántica, elaborado artesanalmente con mimo y detalle.' },

  { id:'p08', img:'imgs/p08.jpg', categoria:'rosas', nombre:'6 Rosas Amarillas', emoji:'💛', precio:55,
    descripcion:'Seis rosas amarillas con eucalipto y paniculata blanca, envueltas en llamativa red dorada con lazo de rafia y el sello de Floristería Alameda. El regalo perfecto para transmitir alegría, agradecimiento o amistad sincera.' },

  { id:'p09', img:'imgs/p09.jpg', categoria:'rosas', nombre:'12 Rosas Azules', emoji:'💙', precio:120,
    descripcion:'Exclusiva docena de rosas pintadas en azul profundo e intenso, con paniculata blanca y eucalipto, presentadas en dramático papel negro con lazo de rafia dorado. Una pieza de lujo única y extraordinaria para los regalos más memorables.' },

  { id:'p10', img:'imgs/p10.jpg', categoria:'rosas', nombre:'Rosa Roja con Arreglo', emoji:'🌹', precio:25,
    descripcion:'Composición romántica con rosas rojas, mini rosas, paniculata blanca y follaje, envuelta en arpillera roja con lazo artesanal y detalle de corazón. Un gesto cargado de significado, perfecto para sorprender con un regalo íntimo y lleno de emoción.' },

  { id:'p11', img:'imgs/p11.jpg', categoria:'rosas', nombre:'Rosa Roja Clásica', emoji:'🌹', precio:15,
    descripcion:'Una única rosa roja de tallo largo acompañada de paniculata blanca, helecho y eucalipto, presentada en elegante envoltorio artesanal de arpillera con lazo. El gesto más puro y directo para expresar amor o afecto sincero. Porque a veces, una sola flor lo dice todo.' },

  { id:'p12', img:'imgs/p12.jpg', categoria:'primavera', nombre:'Ramo de Girasoles', emoji:'🌻', precio:55,
    descripcion:'Alegre composición de girasoles frescos acompañados de flores de temporada y follaje verde exuberante. Presentación artesanal con papel natural y lazo. Un regalo lleno de luz, calor y positividad que alegra cualquier espacio al instante.' },

  { id:'p13', img:'imgs/p13.jpg', categoria:'mixtos', nombre:'Ramo Combinado', emoji:'💐', precio:55,
    descripcion:'Armónico ramo mixto con una cuidada selección de flores de temporada en tonos coordinados. Elaborado artesanalmente con envoltorio y lazo a juego. La opción perfecta para cualquier ocasión que merezca un gesto especial, original y lleno de color.' },

  { id:'p14', img:'imgs/p14.jpg', categoria:'primavera', nombre:'Ramo Campestre', emoji:'🌾', precio:55,
    descripcion:'Composición natural y romántica al estilo campestre, con flores silvestres, verdes aromáticos y follaje de temporada. Presentación en papel kraft rústico con lazo de rafia. Evoca la frescura y libertad del campo mediterráneo en todo su esplendor.' },

  { id:'p15', img:'imgs/p15.jpg', categoria:'mixtos', nombre:'Ramo Variado de Flor', emoji:'🌺', precio:65,
    descripcion:'Gran ramo exuberante compuesto por una variada selección de flores frescas de temporada en múltiples colores. Una composición abundante y llamativa que impresiona tanto al entregarlo como al recibirlo. Perfecto para celebraciones y ocasiones especiales.' },

  { id:'p16', img:'imgs/p16.jpg', categoria:'mixtos', nombre:'Ramo Colores Rojos', emoji:'❤️', precio:95,
    descripcion:'Espectacular composición en intensa gama de rojos con flores premium de temporada. Apasionante y atrevido, combina rosas, gerberas y flores complementarias. Ideal para declaraciones de amor o felicitaciones que buscan un impacto visual inigualable.' },

  { id:'p17', img:'imgs/p17.jpg', categoria:'mixtos', nombre:'Ramo Colores Rosas', emoji:'🌸', precio:95,
    descripcion:'Delicado y romántico ramo en gama de rosas y fucsias con flores premium seleccionadas. Una composición abundante y femenina de gran impacto visual. El regalo ideal para transmitir amor, admiración o ternura en cumpleaños, aniversarios y ocasiones especiales.' },

  { id:'p18', img:'imgs/p18.jpg', categoria:'mixtos', nombre:'Ramo Colores Naranjas', emoji:'🧡', precio:95,
    descripcion:'Vibrante ramo en cálida gama de naranjas y amarillos, lleno de energía y vitalidad. Flores premium de temporada en una composición llamativa y alegre. El regalo perfecto para celebrar el éxito, la alegría o simplemente para arrancar una sonrisa.' },

  { id:'p19', img:'imgs/p19.jpg', categoria:'mixtos', nombre:'Centro Colores Variados', emoji:'💐', precio:125,
    descripcion:'Exuberante centro floral de gran formato con flores premium en una explosión de colores. Presentación sobre base estable, perfecto para centros de mesa. Ideal para bodas, bautizos, comuniones o cualquier celebración que merezca un regalo de máximo impacto.' },

  { id:'p20', img:'imgs/p20.jpg', categoria:'mixtos', nombre:'Ramo Colores Blancos', emoji:'🤍', precio:95,
    descripcion:'Elegante ramo en gama de blancos y cremas con flores premium de temporada. Una composición pura y luminosa que transmite serenidad, sofisticación y refinamiento. Perfecta para bodas, bautizos o para regalar elegancia a alguien que se lo merece todo.' },

  { id:'p21', img:'imgs/p21.jpg', categoria:'primavera', nombre:'Ramo Margaritas Blancas', emoji:'🌼', precio:45,
    descripcion:'Fresco y alegre ramo de margaritas blancas con flores complementarias de temporada. Un clásico intemporal que transmite pureza, sencillez y encanto natural. Perfecto para regalar alegría, frescura y un toque de primavera en cualquier momento del año.' },

  { id:'p22', img:'imgs/p22.jpg', categoria:'orquideas', nombre:'Orquídea Blanca', emoji:'🌸', precio:45,
    descripcion:'Elegante planta de orquídea Phalaenopsis en flor, presentada en maceta decorativa. Un regalo vivo y duradero que embellece cualquier espacio con sus delicadas flores blancas. Perfecta para el hogar o la oficina, florece durante meses con mínimo cuidado.' },

  { id:'p23', img:'imgs/p23.jpg', categoria:'orquideas', nombre:'Orquídea Fucsia', emoji:'💜', precio:95,
    descripcion:'Espectacular planta de orquídea Phalaenopsis en intenso fucsia, presentada en elegante maceta decorativa. Un regalo premium de larga duración que llena de color y distinción cualquier espacio. Con el cuidado adecuado, re-florece año tras año.' },

  { id:'p24', img:'imgs/p24.jpg', categoria:'mixtos', nombre:'Centro Cactus Base Madera', emoji:'🌵', precio:75,
    descripcion:'Original y moderno centro de cactus y suculentas presentado sobre elegante base de madera natural. Una composición única, de muy bajo mantenimiento y altísimo valor decorativo. El regalo ideal para quienes buscan algo diferente, duradero y absolutamente especial.' },

  { id:'p25', img:'imgs/p25.jpg', categoria:'mixtos', nombre:'Ramo Combinado Especial', emoji:'💐', precio:55,
    descripcion:'Selección especial de flores mixtas de temporada combinadas en un ramo de gran presencia. Elaborado a mano con envoltorio artesanal y lazo. Una composición equilibrada y vistosa que se adapta a cualquier gusto y es perfecta para cualquier celebración.' },

  { id:'p26', img:'imgs/p26.jpg', categoria:'mixtos', nombre:'Ramo Variado Primaveral', emoji:'🌺', precio:65,
    descripcion:'Composición primaveral con flores de temporada en tonos frescos y luminosos. Un ramo abundante y alegre, elaborado con mimo, que combina texturas y colores de manera armoniosa. Ideal para regalar frescura y naturalidad en cualquier ocasión especial.' },

  { id:'p27', img:'imgs/p27.jpg', categoria:'mixtos', nombre:'Ramo Variado Colorido', emoji:'🌈', precio:65,
    descripcion:'Explosión de color con una rica selección de flores de temporada en vivos tonos contrastados. Un ramo llamativo y espectacular que no pasa desapercibido. Perfecto para celebraciones, felicitaciones o para alegrar a alguien con un regalo lleno de vida.' },

  { id:'p28', img:'imgs/p28.jpg', categoria:'mixtos', nombre:'Gran Ramo Variado', emoji:'🌸', precio:65,
    descripcion:'Ramo de gran volumen con una exuberante mezcla de flores frescas de temporada. Composición generosa y de alto impacto, elaborada artesanalmente. El regalo perfecto cuando se quiere impresionar y transmitir un sentimiento grande con flores de primera calidad.' },

  { id:'p29', img:'imgs/p29.jpg', categoria:'mixtos', nombre:'Centro Floral Premium', emoji:'💐', precio:125,
    descripcion:'Centro floral de lujo con flores premium seleccionadas en una composición de gran formato y alto impacto visual. Presentación cuidada y elegante, lista para lucir en cualquier espacio. La opción perfecta para bodas, eventos y regalos empresariales de primer nivel.' },

  { id:'p30', img:'imgs/p30.jpg', categoria:'mixtos', nombre:'Centro Floral Especial', emoji:'🌷', precio:125,
    descripcion:'Espectacular centro floral especial con una cuidada selección de flores de temporada en una composición de gran formato. Elaborado artesanalmente con detalle y elegancia. Ideal para centros de mesa en bodas, bautizos y celebraciones de todo tipo.' },
];

var CATEGORIAS = {
  'rosas':'🌹 Rosas', 'mixtos':'💐 Mixtos', 'orquideas':'🌸 Orquídeas', 'primavera':'🌷 Primavera'
};

function renderProductImg(producto, wrapEl, spinId) {
  var img = new Image();
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:center 25%;display:block;opacity:0;transition:opacity 0.35s ease;';
  img.alt = producto.nombre;
  img.onload = function() {
    var spin = document.getElementById(spinId);
    if (spin) spin.remove();
    img.style.opacity = '1';
  };
  img.onerror = function() {
    wrapEl.innerHTML = '<div style="font-size:56px;display:flex;align-items:center;justify-content:center;height:100%;background:#f4f4f2">' + producto.emoji + '</div>';
  };
  img.src = producto.img;
  wrapEl.appendChild(img);
}
