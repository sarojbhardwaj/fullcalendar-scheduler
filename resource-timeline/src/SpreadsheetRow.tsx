import {
  h, BaseComponent, ComponentContext, isArraysEqual, CssDimValue, createRef, Fragment, RenderHook
} from '@fullcalendar/core'
import { Resource, buildResourceFields, ColSpec, ResourceApi, getPublicId } from '@fullcalendar/resource-common'
import ExpanderIcon from './ExpanderIcon'


export interface SpreadsheetRowProps {
  colSpecs: ColSpec[]
  rowSpans: number[]
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  resource: Resource
  innerHeight: CssDimValue // bad name! inner vs innerinner
}


export default class SpreadsheetRow extends BaseComponent<SpreadsheetRowProps, ComponentContext> {

  innerInnerRef = createRef<HTMLDivElement>()


  render(props: SpreadsheetRowProps, state: {}, context: ComponentContext) {
    let { resource, rowSpans, depth } = props
    let resourceFields = buildResourceFields(resource) // slightly inefficient. already done up the call stack

    return (
      <tr>
        {props.colSpecs.map((colSpec, i) => {
          let rowSpan = rowSpans[i]

          if (rowSpan === 0) { // not responsible for group-based rows. VRowGroup is
            return
          } else if (rowSpan == null) {
            rowSpan = 1
          }

          let fieldValue = colSpec.field ? resourceFields[colSpec.field] :
            (resource.title || getPublicId(resource.id))

          if (rowSpan > 1) {
            let hookProps = {
              groupValue: fieldValue,
              view: context.view
            }

            // a grouped cell. no data that is specific to this specific resource
            // `colSpec` is for the group. a GroupSpec :(
            return (
              <RenderHook name='cell' options={colSpec} hookProps={hookProps} defaultContent={renderGroupInner}>
                {(rootElRef, classNames, innerElRef, innerContent) => (
                  // TODO: make data-attr with group value?
                  <td className={[ 'fc-datagrid-cell', 'fc-resource-group' ].concat(classNames).join(' ')} rowSpan={rowSpan} ref={rootElRef}>
                    <div class='fc-datagrid-cell-frame fc-datagrid-cell-frame-liquid'> {/* needed for stickiness in some browsers */}
                      <div class='fc-datagrid-cell-cushion fc-sticky' ref={innerElRef}>
                        {innerContent}
                      </div>
                    </div>
                  </td>
                )}
              </RenderHook>
            )

          } else {
            let hookProps = {
              resource: new ResourceApi(context.calendar, resource),
              fieldValue,
              view: context.view
            }

            return (
              <RenderHook name='cell' options={colSpec} hookProps={hookProps} defaultContent={renderResourceInner}>
                {(rootElRef, classNames, innerElRef, innerContent) => (
                  <td className={[ 'fc-datagrid-cell', 'fc-resource' ].concat(classNames).join(' ')} data-resource-id={resource.id} rowSpan={rowSpan} ref={rootElRef}>
                    <div class='fc-datagrid-cell-frame' style={{ height: props.innerHeight }}>
                      <div class='fc-datagrid-cell-cushion fc-scrollgrid-sync-inner' ref={this.innerInnerRef}>
                        { colSpec.isMain &&
                          <ExpanderIcon
                            depth={depth}
                            hasChildren={props.hasChildren}
                            isExpanded={props.isExpanded}
                            onExpanderClick={this.onExpanderClick}
                          />
                        }
                        <span ref={innerElRef}>
                          {innerContent}
                        </span>
                      </div>
                    </div>
                  </td>
                )}
              </RenderHook>
            )
          }
        })}
      </tr>
    )
  }


  onExpanderClick = (ev: UIEvent) => {
    let { props } = this

    if (props.hasChildren) {
      this.context.calendar.dispatch({
        type: 'SET_RESOURCE_ENTITY_EXPANDED',
        id: props.resource.id,
        isExpanded: !props.isExpanded
      })
    }
  }

}

SpreadsheetRow.addPropsEquality({
  rowSpans: isArraysEqual
})


function renderGroupInner(hookProps) {
  return hookProps.groupValue || <Fragment>&nbsp;</Fragment>
}


function renderResourceInner(hookProps) {
  return hookProps.fieldValue || <Fragment>&nbsp;</Fragment>
}
