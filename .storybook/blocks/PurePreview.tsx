import React, { Children, FunctionComponent, ReactElement, ReactNode, useState } from 'react';
import { darken } from 'polished';
import { styled } from '@storybook/theming';

import { getBlockBackgroundStyle } from  '../components/blocks/BlockBackgroundStyles';
import { Source, SourceProps } from '@storybook/components';
import { ActionBar, ActionItem } from '@storybook/components';
import { Toolbar } from '../components/blocks/Toolbar.tsx';
import { ZoomContext } from  '../components/blocks/ZoomContext';
import { Zoom } from '../components/Zoom/Zoom';

export interface PreviewProps {
  isColumn?: boolean;
  columns?: number;
  withSource?: SourceProps;
  isExpanded?: boolean;
  withToolbar?: boolean;
  className?: string;
  additionalActions?: ActionItem[];
}

type layout = 'padded' | 'fullscreen' | 'centered';

const ChildrenContainer = styled.div<PreviewProps & { layout: layout }>(
  ({ isColumn, columns, layout }) => ({
    display: isColumn || !columns ? 'block' : 'flex',
    position: 'relative',
    flexWrap: 'wrap',
    overflow: 'auto',
    flexDirection: isColumn ? 'column' : 'row',

    '& .innerZoomElementWrapper > *': isColumn
      ? {
          width: layout !== 'fullscreen' ? 'calc(100% - 20px)' : '100%',
          display: 'block',
        }
      : {
          maxWidth: layout !== 'fullscreen' ? 'calc(100% - 20px)' : '100%',
          display: 'inline-block',
        },
  }),
  ({ layout = 'padded' }) =>
    layout === 'centered' || layout === 'padded'
      ? {
          padding: '30px 20px',
          margin: -10,
          '& .innerZoomElementWrapper > *': {
            width: 'auto',
            border: '10px solid transparent!important',
          },
        }
      : {},
  ({ layout = 'padded' }) =>
    layout === 'centered'
      ? {
          display: 'flex',
          justifyContent: 'center',
          justifyItems: 'center',
          alignContent: 'center',
          alignItems: 'center',
        }
      : {},
  ({ columns }) =>
    columns && columns > 1
      ? { '.innerZoomElementWrapper > *': { minWidth: `calc(100% / ${columns} - 20px)` } }
      : {}
);

const StyledSource = styled(Source)<{}>(({ theme }) => ({
  margin: 0,
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
  borderBottomLeftRadius: theme.appBorderRadius,
  borderBottomRightRadius: theme.appBorderRadius,
  border: 'none',

  background:
    theme.base === 'light' ? 'rgba(0, 0, 0, 0.85)' : darken(0.05, theme.background.content),
  color: theme.color.lightest,
  button: {
    background:
      theme.base === 'light' ? 'rgba(0, 0, 0, 0.85)' : darken(0.05, theme.background.content),
  },
}));

const PreviewContainer = styled.div<PreviewProps>(
  ({ theme, withSource, isExpanded }) => ({
    position: 'relative',
    overflow: 'hidden',
    margin: '25px 0 40px',
    ...getBlockBackgroundStyle(theme),
    borderBottomLeftRadius: withSource && isExpanded && 0,
    borderBottomRightRadius: withSource && isExpanded && 0,
    borderBottomWidth: isExpanded && 0,
  }),
  ({ withToolbar }) => withToolbar && { paddingTop: 40 }
);

interface SourceItem {
  source?: ReactElement;
  actionItem: ActionItem;
}

const getSource = (
  withSource: SourceProps,
  expanded: boolean,
  setExpanded: Function,
  htmlComponent: string,
  name: string,
  storyFn: any,
  subcomponents: any,
  parameters: any
): SourceItem => {
  switch (true) {
    case !!(withSource && withSource.error): {
      return {
        source: null,
        actionItem: {
          title: 'No code available',
          disabled: true,
          onClick: () => setExpanded(false),
        },
        actionItemHtml: {
          title: 'No html available',
          disabled: true,
          onClick: () => setExpanded(false),
        },
      };
    }

    case expanded === 'twig': {
      const html = parameters.twig ? parameters.twig : 'not found';
      const htmlSource = {
        code: pretty(html),
        dark: false,
        language: 'jsx',
      };
      return {
        source: <StyledSource {...htmlSource} dark />,
        actionItem: { title: 'react', onClick: () => setExpanded(true) },
        actionItemtwig: {
          title: 'twig',
          onClick: () => setExpanded(false),
        },
        actionItemHtml: {
          title: 'html',
          onClick: () => setExpanded(false),
        },
      };
    }

    case expanded === 'html': {
      const html = ReactDOMServer.renderToStaticMarkup(storyFn).replace(
        /role="[^"]*"/g,
        ''
      );
      const htmlSource = {
        code: pretty(html),
        dark: false,
        language: 'jsx',
      };
      return {
        source: <StyledSource {...htmlSource} dark />,
        actionItem: { title: 'react', onClick: () => setExpanded(true) },
        actionItemtwig: {
          title: 'twig',
          onClick: () => setExpanded('twig'),
        },
        actionItemHtml: {
          title: 'html',
          onClick: () => setExpanded(false),
        },
      };
    }

    case expanded: {
      let a = '';

      if (subcomponents)
        Object.keys(subcomponents).forEach((element) => {
          a = `${a}, ${element}`;
        });
      const reactSource = {
        code: parameters.docs.source
          ? withSource.code
          : `import { ${name} ${a} } from "@wfp/ui";
        
${withSource.code}`,
        dark: false,
        language: 'jsx',
      };
      return {
        source: <StyledSource {...reactSource} dark />,
        actionItem: { title: 'react', onClick: () => setExpanded(false) },
        actionItemtwig: {
          title: 'twig',
          onClick: () => setExpanded('twig'),
        },
        actionItemHtml: {
          title: 'html',
          onClick: () => setExpanded('html'),
        },
      };
    }
    default: {
      return {
        source: null,
        actionItem: { title: 'react', onClick: () => setExpanded(true) },
        actionItemtwig: {
          title: 'twig',
          onClick: () => setExpanded('twig'),
        },
        actionItemHtml: {
          title: 'html',
          onClick: () => setExpanded('html'),
        },
      };
    }
  }
};
function getStoryId(children: ReactNode) {
  if (Children.count(children) === 1) {
    const elt = children as ReactElement;
    if (elt.props) {
      return elt.props.id;
    }
  }
  return null;
}

const PositionedToolbar = styled(Toolbar)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 40,
});

const Relative = styled.div({
  overflow: 'hidden',
  position: 'relative',
});

const getLayout = (children: ReactElement[]): layout => {
  return children.reduce((result, c) => {
    if (result) {
      return result;
    }
    if (typeof c === 'string' || typeof c === 'number') {
      return 'padded';
    }
    return (c.props && c.props.parameters && c.props.parameters.layout) || 'padded';
  }, undefined);
};

/**
 * A preview component for showing one or more component `Story`
 * items. The preview also shows the source for the component
 * as a drop-down.
 */
const Preview: FunctionComponent<PreviewProps> = ({
  isColumn,
  columns,
  children,
  withSource,
  htmlComponent,
  withToolbar = false,
  isExpanded = false,
  // additionalActions,
  className,
  storyComponent,
  subcomponents,
  parameters,
  ...props
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const { source, actionItem,actionItemHtml, actionItemtwig } = getSource(
    withSource,
    expanded,
    setExpanded,
    htmlComponent,
    name,
    storyComponent(),
    subcomponents,
    parameters
  );
  const [scale, setScale] = useState(1);
  const previewClasses = [className].concat(['sbdocs', 'sbdocs-preview']);


  const additionalActions = [];
  if (parameters.code !== false) additionalActions.push(actionItem);
  if (parameters.twig) additionalActions.push(actionItemtwig);
  if (parameters.html !== false) additionalActions.push(actionItemHtml);

  const defaultActionItems = withSource ? [actionItem] : [];
  const actionItems = additionalActions
    ? [/*...defaultActionItems,*/ ...additionalActions]
    : defaultActionItems;

  // @ts-ignore
  const layout = getLayout(Children.count(children) === 1 ? [children] : children);





  return (
    <PreviewContainer
      {...{ withSource, withToolbar }}
      {...props}
      className={previewClasses.join(' ')}
    >
      {withToolbar && (
        <PositionedToolbar
          border
          zoom={(z) => setScale(scale * z)}
          resetZoom={() => setScale(1)}
          storyId={getStoryId(children)}
          baseUrl="./iframe.html"
        />
      )}
      <ZoomContext.Provider value={{ scale }}>
        <Relative className="docs-story">
          <ChildrenContainer
            isColumn={isColumn || !Array.isArray(children)}
            columns={columns}
            layout={layout}
          >
            <Zoom.Element scale={scale}>
              {Array.isArray(children) ? (
                // eslint-disable-next-line react/no-array-index-key
                children.map((child, i) => <div key={i}>{child}</div>)
              ) : (
                <div>{children}</div>
              )}
            </Zoom.Element>
          </ChildrenContainer>
          <ActionBar actionItems={actionItems} />
        </Relative>
      </ZoomContext.Provider>
      {withSource && source}
    </PreviewContainer>
  );
};

export { Preview };