export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'green';
    case 'CANCELLED':
    case 'TERMINATED':
      return 'red';
    case 'PENDING':
    case 'DEMOGRAPHIC_VERIFICATION_PENDING':
    case 'DOCUMENT_UPLOAD_PENDING':
    case 'PLAN_ACTIVATION_PENDING':
      return 'blue';
    case 'DRAFT':
      return 'gray';
    case 'EXPIRED':
      return 'orange';
    default:
      return 'yellow';
  }
};

export const formatStatusText = (status: string) => {
  return status.toLowerCase().replace(/_/g, ' ');
};