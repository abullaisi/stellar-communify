import { ManagerContentList } from './manager-content-list';
import { UploadStepper } from './upload-stepper';

export function ManagerPanel() {
  return (
    <>
      <UploadStepper />
      <ManagerContentList />
    </>
  );
}
