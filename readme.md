# Treebase

Treebase is a JavaScript/TypeScript library for managing tree sctructure data.

## Installation

```bash
yarn add treebase
npm install treebase
```

## Usage

```JavaScript
import Treebase from "treebase"

let dictionary = {
  mainItem: {
    title: "Main menu",
    color: "red"
  },
  innerItem: {
    pid: "mainItem" // pid - parent id (defailt is "root")
    title: "Inner menu",
    color: "green"
  },
  deepInnerItem: {
    pid: "innerItem" // pid - parent id (defailt is "root")
    title: "Deep item",
    color: "yellow"
  }
}

const tree = new Treebase({dictionary: dictionary})

tree.add({
  id: "innerItem",
  title: "Added item menu",
  color: "magenta"
}, check?)

tree.remove("deepInnerItem")

console.log(tree.getTree())

```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)