import { Box, Button, HorizontalStack, Page, Popover, Text, VerticalStack } from "@shopify/polaris";
import { useNavigate, useLocation } from "react-router-dom";
import { learnMoreObject } from "../../../main/onboardingData"
import { useState } from "react";

const PageWithMultipleCards = (props) => {

    const {backUrl, isFirstPage, title, primaryAction, secondaryActions, divider, components, fullWidth} = props

    const location = useLocation();
    const navigate = useNavigate()
    const isNewTab = location.key==='default' || !(window.history.state && window.history.state.idx > 0)
    const [popoverActive, setPopoverActive] = useState(false)

    const navigateBack = () => {
        navigate(-1)
    }

    function getBackAction() {
        if(backUrl){
            return { onAction: ()=>navigate(backUrl) }
        }
        return isNewTab || isFirstPage ? null : { onAction: navigateBack }
    }

    function transformString(inputString) {
        let transformedString = inputString.replace(/^\//, '').replace(/\/$/, '');
        const segments = transformedString.split('/');
        for (let i = 0; i < segments.length; i++) {
            // Check if the segment is alphanumeric
            if (/^[0-9a-fA-F]+$/.test(segments[i]) || /^[0-9]+$/.test(segments[i])) {
            segments[i] = 'id';
            }
        }
        transformedString = segments.join('/');
        transformedString = transformedString.replace(/[/|-]/g, '_');
        return transformedString;
    }

    const learnMoreObj = learnMoreObject[transformString(location.pathname)]

    const learnMoreComp = (
        <Popover
            active={popoverActive}
            activator={(
                <Button onClick={() => setPopoverActive(true)} disclosure>
                    Learn
                </Button>
            )}
            autofocusTarget="first-node"
            onClose={() => { setPopoverActive(false) }}
        >
            <Popover.Section>
                <Box width="230px">
                    <VerticalStack gap={1}>
                        <Text>
                            {learnMoreObj.title}
                        </Text>
                        <Text color="subdued">
                            {learnMoreObj.description}
                        </Text>
                    </VerticalStack>
                </Box>
            </Popover.Section>
        </Popover>
    )

    const useSecondaryActions = (
        <HorizontalStack gap={2}>
            {learnMoreObj ? learnMoreComp : null }
            {secondaryActions}
        </HorizontalStack>
    )

    return (
        <Page fullWidth={fullWidth === undefined ? true: fullWidth}
            title={title}
            backAction={getBackAction()}
            primaryAction={primaryAction}
            secondaryActions={useSecondaryActions}
            divider={divider}
        >
            <VerticalStack gap="4">
                {components?.filter((component) => {
                    return component
                })}
            </VerticalStack>
        </Page>
    )
}

export default PageWithMultipleCards