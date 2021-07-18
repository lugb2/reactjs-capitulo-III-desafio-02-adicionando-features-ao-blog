import { useRouter } from 'next/router';
import styles from './buttonExitPreview.module.scss';

export function ButtonExitPreview(){

	// router
	const router = useRouter();
    
    return (
        <button
            className={styles.buttonExitPreview}
            onClick={() => {
                // sair do preview
                router.push(`/api/exit-preview`);
            }}
        >
            Sair do modo Preview
        </button>
    )
}