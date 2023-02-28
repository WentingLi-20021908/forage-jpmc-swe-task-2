import React, { Component, HTMLAttributes } from 'react';
import { Table } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import './Graph.css';

/**
 * Props declaration for <Graph />
 */
interface IProps {
  data: ServerRespond[],
}

/**
 * Perspective library adds load to HTMLElement prototype.
 * This interface acts as a wrapper for Typescript compiler.
 */
interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}

interface PerspectiveViewerProps extends React.HTMLAttributes<HTMLElement> {
  view?: string;
  'column-pivots'?: string;
  'row-pivots'?: string;
  columns?: string;
  aggregates?: string;
}

declare global {
  namespace  JSX {
    interface  IntrinsicElements {
      'perspective-viewer': PerspectiveViewerProps;
    }
  }
}
/**
 * React component that renders Perspective based on data
 * parsed from its parent through data property.
 */
class Graph extends Component<IProps, {}> {
  // Perspective table
  table: Table | undefined;

  componentDidMount() {
    // Get element to attach the table from the DOM.
    const elem: PerspectiveViewerElement = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      stock: 'string',
      top_ask_price: 'float',
      top_bid_price: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.

      // Add more Perspective configurations here.
      elem.load(this.table);
    }
  }

  componentDidUpdate(prevProps: IProps) {
    // Everytime the data props is updated, insert the data into Perspective table
    if (prevProps.data !== this.props.data && this.table) {
      const newData = this.props.data.filter((el, index, self) =>
      index === self.findIndex((t) => (
          t.stock === el.stock && t.timestamp === el.timestamp
          ))
      );
      // As part of the task, you need to fix the way we update the data props to
      // avoid inserting duplicated entries into Perspective table again.
      this.table.update(newData.map((el: any) => ({
        // Format the data from ServerRespond to the schema
        stock: el.stock,
        top_ask_price: el.top_ask && el.top_ask.price || 0,
        top_bid_price: el.top_bid && el.top_bid.price || 0,
        timestamp: el.timestamp,
      })));
    }
  }
  render() {
    return (
        <perspective-viewer
          view = "y_line"
          column-pivots = '["stock"]'
          row-pivots='["timestamp"]'
          columns='["top_ask_price"]'
          aggregates='{"stock":"distinct count", "top_ask_price":"avg", "top_bid_price":"avg", "timestamp":"distinct count"}'
        />
    );
  }
}

export default Graph;
