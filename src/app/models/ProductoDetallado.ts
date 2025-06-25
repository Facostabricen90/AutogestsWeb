import { Categoria } from "./Categoria";
import { Marca } from "./Marca";
import { Producto } from "./Producto";

interface ProductoDetallado {
  producto: Producto;
  marca: Marca;
  categoria: Categoria;
}
